import type { ConditionOperator, Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { getAIProvider } from "@/lib/ai";
import { recordAudit } from "@/lib/audit/logger";
import { validateCase, validateCaseConsistency, validateParties } from "@/lib/contracts/case-validation";
import { rowsToStructuredCase } from "@/lib/contracts/fields";
import {
  renderDocument,
  type RenderableClause,
  type RenderedDocument,
} from "@/lib/contracts/template-render";
import { buildTemplateVariables, type PartyFacts } from "@/lib/contracts/variable-map";
import { advanceStatus, contractNeedsLawyer, type ActorContext } from "@/lib/contracts/service";
import { assertLawyerRequestTransition, assertTransition } from "@/lib/contracts/state-machine";
import { generateAndStoreDocument } from "@/lib/documents/service";
import { isFormatSupported } from "@/lib/documents/renderers";
import { assignLawyer } from "@/lib/lawyers/assignment";
import { notifyUser } from "@/lib/notifications/service";
import { LOG_EVENTS, logger } from "@/lib/logging";

/**
 * Draft generation and finalisation (§15, §16, §23, §24).
 *
 * A draft is only produced from an approved template version, with validated
 * mandatory facts, and every produced file is stored with its checksum. The model
 * may phrase an introduction; it can never add, remove or reword a clause.
 */

export class DraftValidationError extends Error {
  constructor(
    readonly missingKeys: string[],
    readonly invalid: { key: string; reason: string }[],
    readonly consistencyErrors: string[],
    readonly partyErrors: string[],
  ) {
    super("DRAFT_VALIDATION_FAILED");
    this.name = "DraftValidationError";
  }
}

/** Active template version for a contract type, when the contract has none yet. */
async function resolveTemplateVersion(contractTypeId: string) {
  const template = await db.contractTemplate.findFirst({
    where: { contractTypeId, activeVersion: { isNot: null } },
    include: {
      activeVersion: {
        include: {
          templateClauses: { include: { clause: true }, orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return template?.activeVersion ?? null;
}

type TemplateClauseRow = NonNullable<Awaited<ReturnType<typeof resolveTemplateVersion>>>["templateClauses"][number];

/** Parses the stored inclusion condition without trusting its shape. */
function parseClauseCondition(raw: unknown): RenderableClause["condition"] {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as { field?: unknown; operator?: unknown; value?: unknown };
  if (typeof candidate.field !== "string" || typeof candidate.operator !== "string") return null;
  const value = candidate.value;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return { field: candidate.field, operator: candidate.operator as ConditionOperator };
  }
  return { field: candidate.field, operator: candidate.operator as ConditionOperator, value };
}

function toRenderableClauses(rows: TemplateClauseRow[]): RenderableClause[] {
  return rows.map((row) => ({
    clauseId: row.clauseId,
    code: row.clause.code,
    nameFr: row.clause.nameFr,
    nameAr: row.clause.nameAr,
    bodyFr: row.clause.bodyFr,
    bodyAr: row.clause.bodyAr,
    position: row.position,
    sectionNumber: row.sectionNumber,
    requirement: row.requirement,
    condition: parseClauseCondition(row.condition),
  }));
}

function toPartyFacts(row: {
  role: PartyFacts["role"];
  fullName: string;
  address: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  companyName: string | null;
  companyTaxId: string | null;
  representative: string | null;
}): PartyFacts {
  return {
    role: row.role,
    fullName: row.fullName,
    address: row.address,
    city: row.city,
    email: row.email,
    phone: row.phone,
    nationalId: row.nationalId,
    companyName: row.companyName,
    companyTaxId: row.companyTaxId,
    representative: row.representative,
  };
}

export interface GenerateDraftParams {
  contractId: string;
  actor: ActorContext;
}

export interface GenerateDraftResult {
  versionId: string;
  versionNumber: number;
  documentId: string;
  rendered: RenderedDocument;
  usedTemplateVersionId: string | null;
}

/**
 * Produces (or regenerates) the draft: validate → render approved clauses →
 * store version + DOCX file → move the case to DRAFT_READY.
 */
export async function generateDraftForContract(params: GenerateDraftParams): Promise<GenerateDraftResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: {
      contractType: true,
      fields: true,
      parties: { orderBy: { position: "asc" } },
      templateVersion: {
        include: { templateClauses: { include: { clause: true }, orderBy: { position: "asc" } } },
      },
    },
  });

  const caseData = rowsToStructuredCase(contract.fields);
  const validation = validateCase(contract.contractType.code, caseData, {
    requiredKeys: contract.contractType.requiredFields.length > 0 ? contract.contractType.requiredFields : undefined,
  });
  const consistency = validateCaseConsistency(contract.contractType.code, caseData);
  const parties = validateParties(contract.parties.map((party) => ({ role: party.role, fullName: party.fullName })));

  if (!validation.valid || consistency.errors.length > 0 || !parties.valid) {
    logger.warn(LOG_EVENTS.documentFailed, {
      contractId: contract.id,
      reason: "DRAFT_VALIDATION_FAILED",
      missing: validation.missingKeys,
      invalid: validation.invalid,
      consistency: consistency.errors,
      partyErrors: parties.errors,
    });
    throw new DraftValidationError(validation.missingKeys, validation.invalid, consistency.errors, parties.errors);
  }

  const templateVersion = contract.templateVersion ?? (await resolveTemplateVersion(contract.contractTypeId));
  if (!templateVersion) throw new Error("NO_ACTIVE_TEMPLATE_VERSION");

  const locale = contract.language === "AR" ? "ar" : "fr";
  const variables = buildTemplateVariables(caseData, contract.parties.map(toPartyFacts));
  const clauses = toRenderableClauses(templateVersion.templateClauses);

  let introduction: string[] = [];
  try {
    const provider = getAIProvider();
    const drafted = await provider.generateDraft({
      contractTypeCode: contract.contractType.code,
      language: locale,
      facts: caseData,
      approvedBody: "",
    });
    introduction = drafted.introduction;
  } catch (error) {
    logger.warn(LOG_EVENTS.aiFallback, {
      contractId: contract.id,
      stage: "draft-introduction",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const rendered = renderDocument({ clauses, variables, locale, introduction, title: contract.title });

  await advanceStatus(contract.id, contract.status, "DOCUMENT_GENERATING", {
    actor: params.actor,
    reason: "draft-generation",
    metadata: { templateVersionId: templateVersion.id, includedClauses: rendered.includedClauses.length },
  });

  const lastVersion = await db.contractVersion.findFirst({
    where: { contractId: contract.id },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const version = await db.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber,
      kind: "AI_DRAFT",
      createdById: params.actor.id,
      createdByRole: params.actor.role,
      content: rendered.body,
      variablesJson: variables as unknown as Prisma.InputJsonValue,
      templateVersionId: templateVersion.id,
      changeSummary:
        versionNumber === 1
          ? "Génération initiale du projet"
          : `Régénération du projet (version ${versionNumber})`,
    },
  });

  const document = await generateAndStoreDocument({
    contractId: contract.id,
    ownerId: contract.clientId,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    documentType: "DRAFT_CONTRACT",
    contractVersionId: version.id,
    format: "docx",
    title: contract.title,
    body: rendered.body,
    language: locale,
    reference: contract.reference,
    contractTypeFr: contract.contractType.nameFr,
    contractTypeAr: contract.contractType.nameAr,
    versionNumber,
  });

  await db.contract.update({
    where: { id: contract.id },
    data: { currentVersionId: version.id, templateVersionId: templateVersion.id },
  });

  await advanceStatus(contract.id, "DOCUMENT_GENERATING", "DRAFT_READY", {
    actor: params.actor,
    reason: "draft-ready",
    metadata: { versionNumber, documentId: document.id, checksum: document.checksum },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "DRAFT_READY",
    title: locale === "ar" ? "المشروع جاهز" : "Votre projet de contrat est prêt",
    body:
      locale === "ar"
        ? `تم إعداد مشروع العقد ${contract.reference} من النموذج المعتمد.`
        : `Le projet de contrat ${contract.reference} a été préparé à partir du modèle approuvé.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
    locale,
  });

  logger.info(LOG_EVENTS.documentGenerated, {
    contractId: contract.id,
    versionNumber,
    documentId: document.id,
    unresolvedVariables: rendered.unresolvedVariables.length,
    missingVariables: rendered.missingVariables.length,
  });

  return {
    versionId: version.id,
    versionNumber,
    documentId: document.id,
    rendered,
    usedTemplateVersionId: templateVersion.id,
  };
}

export interface LawyerRequestOutcome {
  requested: boolean;
  assigned: boolean;
  lawyerUserId: string | null;
  reason: string;
}

/**
 * Creates (if needed) and assigns the lawyer request after the draft exists (§19).
 *
 * When no lawyer can be assigned the client is told instead of waiting silently;
 * the case stays in DRAFT_READY and the request in ASSIGNMENT_PENDING so an admin
 * can act.
 */
export async function requestLawyerForContract(params: {
  contractId: string;
  actor: ActorContext;
}): Promise<LawyerRequestOutcome> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { contractType: true, lawyerRequest: true },
  });

  const needsLawyer = contractNeedsLawyer(contract.route) || Boolean(contract.lawyerRequest);
  if (!needsLawyer) return { requested: false, assigned: false, lawyerUserId: null, reason: "NOT_REQUIRED" };

  const request =
    contract.lawyerRequest ??
    (await db.lawyerRequest.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        serviceType: "LAWYER_REVIEW",
        status: "CREATED",
        requiresSignature: contract.route === "LAWYER_SIGNATURE_REQUIRED",
      },
    }));

  if (request.status === "ASSIGNED" || request.status === "UNDER_REVIEW") {
    return { requested: true, assigned: true, lawyerUserId: request.lawyerId, reason: "ALREADY_ASSIGNED" };
  }

  if (request.status === "CREATED") {
    assertLawyerRequestTransition("CREATED", "ASSIGNMENT_PENDING");
    await db.lawyerRequest.update({ where: { id: request.id }, data: { status: "ASSIGNMENT_PENDING" } });
  }

  const outcome = await assignLawyer({
    contractId: contract.id,
    lawyerRequestId: request.id,
    specializationHint: contract.contractType.category,
    requiredLanguages: [contract.language],
    jurisdiction: contract.jurisdiction,
    actorId: params.actor.id,
  });

  if (!outcome.assigned || !outcome.candidate) {
    await notifyUser({
      userId: contract.clientId,
      type: "ASSIGNMENT_FAILED",
      title: "Attribution en cours",
      body:
        "Aucun avocat n'est disponible immédiatement pour votre dossier. Notre équipe a été alertée et vous serez notifié dès l'attribution.",
      href: `/app/contracts/${contract.id}`,
      contractId: contract.id,
    });
    return { requested: true, assigned: false, lawyerUserId: null, reason: outcome.failureReason ?? outcome.reason };
  }

  const dueAt = new Date(Date.now() + 48 * 3600 * 1000);
  await db.lawyerRequest.update({
    where: { id: request.id },
    data: {
      status: "ASSIGNED",
      dueAt,
      missingInformation: [],
      informationRequest: null,
    },
  });

  if (contract.status === "DRAFT_READY") {
    assertTransition("DRAFT_READY", "LAWYER_PENDING");
    await db.contract.update({ where: { id: contract.id }, data: { status: "LAWYER_PENDING" } });
    await recordAudit({
      action: "CONTRACT_STATUS_CHANGED",
      entityType: "Contract",
      entityId: contract.id,
      actorId: params.actor.id,
      actorRole: params.actor.role,
      metadata: { from: "DRAFT_READY", to: "LAWYER_PENDING", reason: "lawyer-assignment" },
    });
  }

  await notifyUser({
    userId: outcome.candidate.userId,
    type: "LAWYER_ASSIGNED",
    title: "Nouveau dossier attribué",
    body: `Le dossier ${contract.reference} vous a été attribué (échéance indicative : 48 h).`,
    href: `/lawyer/cases/${contract.id}`,
    contractId: contract.id,
  });

  await notifyUser({
    userId: contract.clientId,
    type: "LAWYER_ASSIGNED",
    title: "Un avocat a été attribué à votre dossier",
    body: `Le dossier ${contract.reference} a été attribué automatiquement à un avocat de la plateforme.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });

  await recordAudit({
    action: "LAWYER_ASSIGNED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, lawyerUserId: outcome.candidate.userId, score: outcome.candidate.score, reason: outcome.reason },
  });

  return { requested: true, assigned: true, lawyerUserId: outcome.candidate.userId, reason: outcome.reason };
}

export interface FinalizeResult {
  versionNumber: number;
  documentId: string;
  pdfDocumentId: string | null;
}

/**
 * Freezes the final document (§23, §24).
 *
 * Allowed from DRAFT_READY (self-service), VALIDATED (reviewed, no signature
 * rule) or SIGNED. A route that requires a lawyer signature can never reach FINAL
 * before the signature happened — the state machine refuses it.
 */
export async function finalizeContract(params: { contractId: string; actor: ActorContext }): Promise<FinalizeResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { contractType: true, currentVersion: true, lawyerRequest: true },
  });

  const finalizable = ["DRAFT_READY", "VALIDATED", "SIGNED"];
  if (!finalizable.includes(contract.status)) throw new Error(`CONTRACT_NOT_FINALIZABLE: ${contract.status}`);
  if (contract.route === "LAWYER_SIGNATURE_REQUIRED" && contract.status !== "SIGNED") {
    throw new Error("LAWYER_SIGNATURE_REQUIRED_BEFORE_FINALIZATION");
  }

  const content = contract.currentVersion?.content;
  if (!content) throw new Error("CONTRACT_HAS_NO_VERSION");

  const signed = contract.status === "SIGNED";
  const locale = contract.language === "AR" ? "ar" : "fr";

  const lastVersion = await db.contractVersion.findFirst({
    where: { contractId: contract.id },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const version = await db.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber,
      kind: signed ? "SIGNED" : "FINAL",
      createdById: params.actor.id,
      createdByRole: params.actor.role,
      content,
      templateVersionId: contract.currentVersion?.templateVersionId ?? null,
      changeSummary: signed ? "Version signée du contrat" : "Version finale du contrat",
      immutable: true,
    },
  });

  const document = await generateAndStoreDocument({
    contractId: contract.id,
    ownerId: contract.clientId,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    documentType: signed ? "SIGNED_CONTRACT" : "FINAL_CONTRACT",
    contractVersionId: version.id,
    format: "docx",
    title: contract.title,
    body: content,
    language: locale,
    reference: contract.reference,
    contractTypeFr: contract.contractType.nameFr,
    contractTypeAr: contract.contractType.nameAr,
    versionNumber,
    immutable: true,
    filenameSuffix: signed ? "signe" : "final",
  });

  let pdfDocumentId: string | null = null;
  if (isFormatSupported("pdf", locale).supported) {
    try {
      const pdf = await generateAndStoreDocument({
        contractId: contract.id,
        ownerId: contract.clientId,
        actorId: params.actor.id,
        actorRole: params.actor.role,
        documentType: signed ? "SIGNED_CONTRACT" : "FINAL_CONTRACT",
        contractVersionId: version.id,
        format: "pdf",
        title: contract.title,
        body: content,
        language: locale,
        reference: contract.reference,
        contractTypeFr: contract.contractType.nameFr,
        contractTypeAr: contract.contractType.nameAr,
        versionNumber,
        immutable: true,
        filenameSuffix: signed ? "signe" : "final",
      });
      pdfDocumentId = pdf.id;
    } catch (error) {
      logger.warn(LOG_EVENTS.documentFailed, {
        contractId: contract.id,
        format: "pdf",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await db.contract.update({
    where: { id: contract.id },
    data: { status: "FINAL", finalizedAt: new Date(), currentVersionId: version.id },
  });

  if (contract.lawyerRequest && (contract.lawyerRequest.status === "VALIDATED" || contract.lawyerRequest.status === "SIGNED")) {
    assertLawyerRequestTransition(contract.lawyerRequest.status, "COMPLETED");
    await db.lawyerRequest.update({
      where: { id: contract.lawyerRequest.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  await recordAudit({
    action: "CONTRACT_FINALIZED",
    entityType: "Contract",
    entityId: contract.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { versionNumber, documentId: document.id, pdfDocumentId, signed, route: contract.route },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "DOCUMENT_FINALIZED",
    title: signed ? "Votre contrat signé est disponible" : "Votre document final est disponible",
    body: `Le document final du dossier ${contract.reference} peut être téléchargé depuis votre espace.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
    locale,
  });

  logger.info(LOG_EVENTS.documentGenerated, {
    contractId: contract.id,
    documentType: signed ? "SIGNED_CONTRACT" : "FINAL_CONTRACT",
    versionNumber,
  });

  return { versionNumber, documentId: document.id, pdfDocumentId };
}

/**
 * Records the information the lawyer asked for (§21).
 *
 * The platform deliberately does not send a conflicting notification type for
 * this event: the answer is attached to the request and audited, and the lawyer
 * sees the case back in their workspace.
 */
export async function provideRequestedInformation(params: {
  contractId: string;
  actor: ActorContext;
  text: string;
}): Promise<void> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true },
  });

  if (contract.clientId !== params.actor.id) throw new Error("FORBIDDEN");

  const request = contract.lawyerRequest;
  if (!request) throw new Error("NO_LAWYER_REQUEST");
  if (request.status !== "INFORMATION_REQUESTED") throw new Error(`NOT_AWAITING_INFORMATION: ${request.status}`);

  assertLawyerRequestTransition(request.status, "UNDER_REVIEW");

  const previous = (request.summaryJson as Record<string, unknown> | null) ?? {};
  await db.lawyerRequest.update({
    where: { id: request.id },
    data: {
      status: "UNDER_REVIEW",
      informationProvidedAt: new Date(),
      summaryJson: {
        ...previous,
        lastClientResponse: params.text,
        lastClientResponseAt: new Date().toISOString(),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  await recordAudit({
    action: "INFORMATION_PROVIDED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, characters: params.text.length },
  });
}
