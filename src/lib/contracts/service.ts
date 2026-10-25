import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import {
  actorAudit,
  actorId,
  actorLabel,
  assertCaseAccess,
  ownerColumnsFor,
  type CaseActor,
  type UserActor,
} from "@/lib/contracts/actor";
import { classifyIntentSafely, type IntentClassification } from "@/lib/ai";
import { getFieldSpec } from "@/lib/contracts/field-catalog";
import { rowsToStructuredCase, toFieldData } from "@/lib/contracts/fields";
import { buildQuestionSet, collectRuleFieldKeys } from "@/lib/contracts/question-engine";
import { assertLawyerRequestTransition, assertTransition } from "@/lib/contracts/state-machine";
import { PRIMARY_JURISDICTION, decideRoute } from "@/lib/legal-routing/router";
import type { RoutingDecisionResult, RoutingRuleDefinition } from "@/lib/legal-routing/types";
import { quoteService } from "@/lib/payments/pricing";
import { releaseAuthorizedPaymentInSandbox } from "@/lib/payments/service";
import { buildServiceOffers, resolveOfferChoice, type ServiceOfferKey } from "@/lib/contracts/service-offers";
import { LOG_EVENTS, logger } from "@/lib/logging";
import type { AppLocale } from "@/lib/i18n/config";

/**
 * Contract intake and routing orchestration (§9, §10, §30, §58).
 *
 * The AI proposes an intent; the catalogue resolves it to a contract type; the
 * questionnaire is built from declared fields and rule dependencies; the route
 * comes from the verified-rule engine only. Nothing in this module trusts a
 * client-supplied contract type, price or route.
 */

/** A signed-in actor. Kept as a named alias because it predates guest sessions. */
export type ActorContext = UserActor;

export interface ContractTypeSummary {
  id: string;
  code: string;
  nameFr: string;
  nameAr: string;
  category: string;
  active: boolean;
  requiredFields: string[];
}

/** Sequential, human-readable reference (WQC-YYYY-NNN) generated server-side.
 *  Verification cases keep their own WQV-YYYY-NNN series (§8b): the prefix
 *  tells apart a drafted contract from a checked existing document. */
export async function nextContractReference(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = `WQC-${year}-`;
  const last = await db.contract.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const lastSequence = last ? Number.parseInt(last.reference.slice(prefix.length), 10) : 0;
  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function loadActiveContractTypes(): Promise<ContractTypeSummary[]> {
  return db.contractType.findMany({
    where: { active: true, status: "ACTIVE" },
    orderBy: [{ category: "asc" }, { nameFr: "asc" }],
    select: {
      id: true,
      code: true,
      nameFr: true,
      nameAr: true,
      category: true,
      active: true,
      requiredFields: true,
    },
  });
}

/** Catalogue shape handed to the classifier (never the whole database row). */
function toCatalog(types: ContractTypeSummary[]) {
  return types.map((type) => ({
    code: type.code,
    nameFr: type.nameFr,
    nameAr: type.nameAr,
    category: type.category,
    intents: [] as string[],
  }));
}

/** Resolves the contract type from an explicit choice, then AI candidates. */
async function resolveContractType(
  types: ContractTypeSummary[],
  classification: IntentClassification,
  explicitCode?: string | null,
): Promise<ContractTypeSummary | null> {
  if (explicitCode) {
    const explicit = types.find((type) => type.code === explicitCode);
    if (explicit) return explicit;
  }
  for (const candidate of classification.candidateContractTypes) {
    const byCode = types.find((type) => type.code === candidate);
    if (byCode) return byCode;
  }
  return db.contractType.findFirst({
    where: { active: true, status: "ACTIVE", intents: { has: classification.intentCode } },
    select: {
      id: true,
      code: true,
      nameFr: true,
      nameAr: true,
      category: true,
      active: true,
      requiredFields: true,
    },
  });
}

/**
 * Persists facts as typed rows. Unknown keys produced by the model are dropped:
 * the field catalogue — not the model — defines what a case can contain.
 */
async function persistAnswers(
  contractId: string,
  contractTypeCode: string,
  values: Record<string, unknown> | undefined,
  source: "CLIENT_ANSWER" | "AI_EXTRACTED" | "LAWYER_EDITED" | "SYSTEM",
): Promise<{ allowed: string[]; ignored: string[] }> {
  const allowed: string[] = [];
  const ignored: string[] = [];

  for (const [key, raw] of Object.entries(values ?? {})) {
    const spec = getFieldSpec(contractTypeCode, key);
    if (!spec) {
      ignored.push(key);
      continue;
    }
    const data = toFieldData(contractId, spec, raw, source);
    const { contractId: _contractId, key: _key, ...update } = data;
    await db.contractField.upsert({
      where: { contractId_key: { contractId, key } },
      create: data,
      update,
    });
    allowed.push(key);
  }

  return { allowed, ignored };
}

/** Question set for a stored contract: declared fields + rule dependencies. */
export async function buildQuestionSetFor(
  contractId: string,
  contractType: { id: string; code: string; requiredFields: string[] },
) {
  const [fields, rules] = await Promise.all([
    db.contractField.findMany({ where: { contractId } }),
    db.legalRule.findMany({
      where: {
        active: true,
        jurisdiction: PRIMARY_JURISDICTION,
        OR: [{ contractTypeId: contractType.id }, { contractTypeId: null }],
      },
      select: { conditions: { select: { field: true } } },
    }),
  ]);

  return buildQuestionSet({
    contractTypeCode: contractType.code,
    contractTypeRequiredFields: contractType.requiredFields,
    ruleFieldKeys: collectRuleFieldKeys(rules),
    caseData: rowsToStructuredCase(fields),
  });
}

/** Central status writer: every change is asserted and audited (§37). */
export async function transitionStatus(
  contractId: string,
  from: Parameters<typeof assertTransition>[0],
  to: Parameters<typeof assertTransition>[1],
  context: { actor: CaseActor; reason: string; metadata?: Record<string, unknown> },
): Promise<void> {
  assertTransition(from, to);
  await db.contract.update({ where: { id: contractId }, data: { status: to } });
  await recordAudit({
    action: "CONTRACT_STATUS_CHANGED",
    entityType: "Contract",
    entityId: contractId,
    ...actorAudit(context.actor),
    metadata: { from, to, reason: context.reason, ...(context.metadata ?? {}) },
  });
}

export interface CreateContractRequestParams {
  actor: ActorContext;
  text: string;
  locale: AppLocale;
  contractTypeCode?: string | null;
}

export interface CreateContractRequestResult {
  contractId: string;
  reference: string;
  contractType: ContractTypeSummary | null;
  classification: IntentClassification;
  providerName: string;
  fellBack: boolean;
  missingKeys: string[];
}

/**
 * Creates the case from the client's own words.
 *
 * The classification is stored verbatim (intent code, confidence, raw text,
 * bilingual summaries) so the decision can be reviewed later; extracted facts are
 * only kept when the catalogue declares the field.
 */
export async function createContractRequest(
  params: CreateContractRequestParams,
): Promise<CreateContractRequestResult> {
  const text = params.text.trim();
  if (text.length < 3) throw new Error("INTENT_TEXT_TOO_SHORT");

  const types = await loadActiveContractTypes();
  const { classification, providerName, fellBack } = await classifyIntentSafely({
    text,
    locale: params.locale,
    catalog: toCatalog(types),
  });

  const contractType = await resolveContractType(types, classification, params.contractTypeCode);
  if (!contractType) throw new Error("CONTRACT_TYPE_UNRESOLVED");

  const reference = await nextContractReference();
  const language = params.locale === "ar" ? "AR" : "FR";

  const contract = await db.contract.create({
    data: {
      reference,
      clientId: params.actor.id,
      contractTypeId: contractType.id,
      title: `${params.locale === "ar" ? contractType.nameAr : contractType.nameFr} — ${reference}`,
      language,
      jurisdiction: PRIMARY_JURISDICTION,
      status: "DRAFT",
      intentCode: classification.intentCode,
      intentConfidence: classification.confidence,
      rawIntentText: text,
      intentJson: classification as unknown as Prisma.InputJsonValue,
      summaryFr: classification.summaryFr,
      summaryAr: classification.summaryAr,
      submittedAt: new Date(),
    },
  });

  const extracted = await persistAnswers(
    contract.id,
    contractType.code,
    classification.extractedFacts as Record<string, unknown>,
    "AI_EXTRACTED",
  );
  const questionSet = await buildQuestionSetFor(contract.id, contractType);

  await transitionStatus(contract.id, "DRAFT", questionSet.missingKeys.length > 0 ? "INFORMATION_REQUIRED" : "READY_FOR_ROUTING", {
    actor: params.actor,
    reason: "intake",
  });

  await recordAudit({
    action: "INTENT_CLASSIFIED",
    entityType: "Contract",
    entityId: contract.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: {
      intentCode: classification.intentCode,
      confidence: classification.confidence,
      providerName,
      fellBack,
      dialect: classification.dialect,
      contractTypeCode: contractType.code,
      extractedFieldCount: extracted.allowed.length,
      ignoredFieldCount: extracted.ignored.length,
    },
  });

  await recordAudit({
    action: "CONTRACT_CREATED",
    entityType: "Contract",
    entityId: contract.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { reference, contractTypeCode: contractType.code, locale: params.locale },
  });

  logger.info(LOG_EVENTS.intentClassified, {
    contractId: contract.id,
    intentCode: classification.intentCode,
    providerName,
    fellBack,
  });

  return {
    contractId: contract.id,
    reference,
    contractType,
    classification,
    providerName,
    fellBack,
    missingKeys: questionSet.missingKeys,
  };
}

export interface SaveAnswersParams {
  contractId: string;
  actor: CaseActor;
  values: Record<string, unknown>;
}

/**
 * Persists the wizard answers, then moves the case to routing as soon as the
 * questionnaire is complete (§30, §41).
 */
export async function saveContractAnswers(
  params: SaveAnswersParams,
): Promise<{ missingKeys: string[]; status: string }> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { contractType: true, fields: true },
  });

  assertCaseAccess(contract, params.actor);

  await persistAnswers(params.contractId, contract.contractType.code, params.values, "CLIENT_ANSWER");

  const questionSet = await buildQuestionSetFor(params.contractId, contract.contractType);
  const target = questionSet.missingKeys.length > 0 ? "INFORMATION_REQUIRED" : "READY_FOR_ROUTING";

  if (contract.status !== target && (contract.status === "DRAFT" || contract.status === "INFORMATION_REQUIRED" || contract.status === "READY_FOR_ROUTING")) {
    await transitionStatus(params.contractId, contract.status, target, {
      actor: params.actor,
      reason: "questionnaire",
      metadata: { answeredKeys: Object.keys(params.values), missing: questionSet.missingKeys.length },
    });
  }

  await recordAudit({
    action: "QUESTIONNAIRE_UPDATED",
    entityType: "Contract",
    entityId: params.contractId,
    ...actorAudit(params.actor),
    metadata: { answeredKeys: Object.keys(params.values), missingKeys: questionSet.missingKeys },
  });

  return { missingKeys: questionSet.missingKeys, status: target };
}

/** Ordered statuses the platform advances through without a human decision. */
const AUTOMATIC_CHAIN = [
  "DRAFT",
  "INFORMATION_REQUIRED",
  "READY_FOR_ROUTING",
  "ROUTED",
  "PAYMENT_REQUIRED",
  "PAYMENT_CONFIRMED",
  "DOCUMENT_GENERATING",
  "DRAFT_READY",
] as const;

type AutomaticStatus = (typeof AUTOMATIC_CHAIN)[number];
type WalkTarget = AutomaticStatus | "MANUAL_REVIEW_REQUIRED";

/**
 * Walks the contract to `target` through legal transitions only (§37).
 *
 * Every hop is asserted by the state machine; one audit entry records the overall
 * move so the timeline stays readable.
 */
export async function advanceStatus(
  contractId: string,
  from: string,
  target: WalkTarget,
  context: { actor: CaseActor; reason: string; metadata?: Record<string, unknown> },
): Promise<void> {
  if (from === target) return;

  if (from === "MANUAL_REVIEW_REQUIRED") {
    await transitionStatus(contractId, "MANUAL_REVIEW_REQUIRED", "ROUTED", context);
    if (target === "ROUTED") return;
    await advanceStatus(contractId, "ROUTED", target, context);
    return;
  }

  if (target === "MANUAL_REVIEW_REQUIRED") {
    await advanceStatus(contractId, from, "READY_FOR_ROUTING", context);
    await transitionStatus(contractId, "READY_FOR_ROUTING", "MANUAL_REVIEW_REQUIRED", context);
    return;
  }

  const fromIndex = AUTOMATIC_CHAIN.indexOf(from as AutomaticStatus);
  const targetIndex = AUTOMATIC_CHAIN.indexOf(target);
  if (fromIndex === -1 || targetIndex === -1 || targetIndex < fromIndex) {
    await transitionStatus(contractId, from as AutomaticStatus, target, context);
    return;
  }

  let current: AutomaticStatus = AUTOMATIC_CHAIN[fromIndex]!;
  for (let index = fromIndex; index < targetIndex; index += 1) {
    const next = AUTOMATIC_CHAIN[index + 1]!;
    assertTransition(current, next);
    await db.contract.update({ where: { id: contractId }, data: { status: next } });
    current = next;
  }

  await recordAudit({
    action: "CONTRACT_STATUS_CHANGED",
    entityType: "Contract",
    entityId: contractId,
    ...actorAudit(context.actor),
    metadata: { from, to: target, reason: context.reason, ...(context.metadata ?? {}) },
  });
}

/** Rules that may influence routing, mapped to the engine's definition shape. */
export async function loadRulesForRouting(contractTypeId: string): Promise<RoutingRuleDefinition[]> {
  const rows = await db.legalRule.findMany({
    where: {
      active: true,
      jurisdiction: PRIMARY_JURISDICTION,
      OR: [{ contractTypeId }, { contractTypeId: null }],
    },
    include: { conditions: true, legalSource: true },
  });

  return rows.map((rule) => ({
    id: rule.id,
    code: rule.code,
    title: rule.title,
    description: rule.description,
    ruleKind: rule.ruleKind,
    status: rule.status,
    active: rule.active,
    jurisdiction: rule.jurisdiction,
    contractTypeId: rule.contractTypeId,
    scope: rule.scope,
    route: rule.route,
    lawyerReview: rule.lawyerReview,
    lawyerSignature: rule.lawyerSignature,
    specialistRequired: rule.specialistRequired,
    specialistType: rule.specialistType,
    writtenContractRequired: rule.writtenContractRequired,
    manualReviewRequired: rule.manualReviewRequired,
    priority: rule.priority,
    reasonCode: rule.reasonCode,
    effectiveFrom: rule.effectiveFrom,
    effectiveTo: rule.effectiveTo,
    article: rule.article,
    internalPolicyRef: rule.internalPolicyRef,
    legalSource: rule.legalSource
      ? {
          id: rule.legalSource.id,
          code: rule.legalSource.code,
          title: rule.legalSource.title,
          lawNumber: rule.legalSource.lawNumber,
          article: rule.legalSource.article,
          officialUrl: rule.legalSource.officialUrl,
          verificationStatus: rule.legalSource.verificationStatus,
          effectiveDate: rule.legalSource.effectiveDate,
          expiryDate: rule.legalSource.expiryDate,
        }
      : null,
    conditions: rule.conditions.map((condition) => ({
      id: condition.id,
      field: condition.field,
      operator: condition.operator,
      valueText: condition.valueText,
      valueNumber: condition.valueNumber === null ? null : Number(condition.valueNumber),
      valueBoolean: condition.valueBoolean,
      valueList: condition.valueList,
      groupIndex: condition.groupIndex,
      label: condition.label,
    })),
  }));
}

/** True when a lawyer form part of this case's configured path. */
export function contractNeedsLawyer(route: string | null): boolean {
  return route === "LAWYER_REQUIRED" || route === "LAWYER_SIGNATURE_REQUIRED";
}

export interface RouteContractParams {
  contractId: string;
  actor: CaseActor;
}

export interface RouteContractResult {
  decision: RoutingDecisionResult;
  decisionId: string;
  status: string;
  price: number | null;
  currency: string;
}

/**
 * Runs the deterministic router and persists an auditable decision (§10, §37).
 *
 * Verified rules only: the engine itself excludes draft, unverified, expired and
 * out-of-scope rules, and refuses to guess when nothing matches (§39).
 */
export async function routeContract(params: RouteContractParams): Promise<RouteContractResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { contractType: true, fields: true, lawyerRequest: true },
  });

  assertCaseAccess(contract, params.actor);

  const rules = await loadRulesForRouting(contract.contractType.id);
  const decision = decideRoute({
    jurisdiction: contract.jurisdiction,
    contractType: {
      id: contract.contractType.id,
      code: contract.contractType.code,
      active: contract.contractType.active,
      nameFr: contract.contractType.nameFr,
      nameAr: contract.contractType.nameAr,
    },
    intentCode: contract.intentCode,
    caseData: rowsToStructuredCase(contract.fields),
    rules,
  });

  await db.routingDecision.updateMany({
    where: { contractId: contract.id, status: "PROPOSED" },
    data: { status: "SUPERSEDED" },
  });

  const created = await db.routingDecision.create({
    data: {
      contractId: contract.id,
      route: decision.route,
      lawyerReviewRequirement: decision.lawyerReviewRequirement,
      lawyerSignatureRequirement: decision.lawyerSignatureRequirement,
      specialistRequired: decision.specialistRequired,
      specialistType: decision.specialistType,
      writtenContractRequired: decision.writtenContractRequired,
      manualReviewRequired: decision.manualReviewRequired,
      reason: decision.reason,
      reasonCodes: [...decision.reasonCodes],
      matchedRuleIds: decision.matchedRuleIds,
      legalSourceIds: decision.legalSourceIds,
      missingRuleContext: decision.missingRuleContext,
      engineVersion: decision.engineVersion,
      ruleSnapshot: decision.ruleSnapshot as unknown as Prisma.InputJsonValue,
      status: "CONFIRMED",
      requestedByUserId: actorId(params.actor),
      confirmedAt: new Date(),
    },
  });

  const needsLawyer = contractNeedsLawyer(decision.route);
  if (needsLawyer && !contract.lawyerRequest) {
    await db.lawyerRequest.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        serviceType: "LAWYER_REQUIRED_SERVICE",
        status: "CREATED",
        requiresSignature: decision.lawyerSignatureRequirement === "REQUIRED",
      },
    });
  }

  const manual =
    decision.route === "ROUTING_UNDETERMINED" ||
    decision.route === "UNSUPPORTED" ||
    decision.route === "SPECIALIST_REQUIRED" ||
    decision.manualReviewRequired;

  const target: WalkTarget = manual ? "MANUAL_REVIEW_REQUIRED" : decision.route === "LAWYER_OPTIONAL" ? "ROUTED" : "PAYMENT_REQUIRED";

  const quote = quoteService({
    route: decision.route,
    lawyerServiceSelected: needsLawyer,
    signatureRequired: decision.lawyerSignatureRequirement === "REQUIRED",
    currency: contract.priceCurrency,
  });

  await db.contract.update({
    where: { id: contract.id },
    data: {
      route: decision.route,
      routedAt: new Date(),
      priceAmount: quote.payable ? quote.amount : null,
    },
  });

  await advanceStatus(contract.id, contract.status, target, {
    actor: params.actor,
    reason: "routing",
    metadata: { route: decision.route, decisionId: created.id },
  });

  await recordAudit({
    action: manual ? "ROUTING_UNDETERMINED" : "ROUTING_DECIDED",
    entityType: "RoutingDecision",
    entityId: created.id,
    ...actorAudit(params.actor),
    metadata: {
      contractId: contract.id,
      route: decision.route,
      reasonCodes: decision.reasonCodes,
      matchedRuleIds: decision.matchedRuleIds,
      engineVersion: decision.engineVersion,
      gaps: decision.missingRuleContext,
    },
  });

  if (manual) {
    logger.warn(LOG_EVENTS.routingUndetermined, { contractId: contract.id, route: decision.route, gaps: decision.missingRuleContext });
  } else {
    logger.info(LOG_EVENTS.routingDecided, {
      contractId: contract.id,
      route: decision.route,
      matchedRules: decision.matchedRuleIds.length,
    });
  }

  return {
    decision,
    decisionId: created.id,
    status: target,
    price: quote.payable ? quote.amount : null,
    currency: quote.currency,
  };
}

export interface ChooseLawyerServiceParams {
  contractId: string;
  actor: CaseActor;
  lawyerServiceSelected: boolean;
}

/**
 * Applies the client's choice on a LAWYER_OPTIONAL case (§18).
 *
 * The choice is never a lawyer pick: the platform assigns the lawyer later. It
 * only records whether the review service was requested, which drives both the
 * price and the payment step.
 */
export async function chooseLawyerService(
  params: ChooseLawyerServiceParams,
): Promise<{ price: number; currency: string; lawyerRequested: boolean }> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true },
  });

  assertCaseAccess(contract, params.actor);
  if (contract.route !== "LAWYER_OPTIONAL") throw new Error("SERVICE_CHOICE_NOT_APPLICABLE");
  if (contract.status !== "ROUTED" && contract.status !== "PAYMENT_REQUIRED") {
    throw new Error(`INVALID_CONTRACT_STATUS_FOR_SERVICE_CHOICE: ${contract.status}`);
  }

  let lawyerRequested = Boolean(contract.lawyerRequest);
  if (params.lawyerServiceSelected && !contract.lawyerRequest) {
    await db.lawyerRequest.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        serviceType: "LAWYER_REVIEW",
        status: "CREATED",
      },
    });
    lawyerRequested = true;
  }
  if (!params.lawyerServiceSelected && contract.lawyerRequest) {
    throw new Error("LAWYER_REVIEW_ALREADY_REQUESTED");
  }

  const quote = quoteService({
    route: "LAWYER_OPTIONAL",
    lawyerServiceSelected: lawyerRequested,
    signatureRequired: false,
    currency: contract.priceCurrency,
  });

  await db.contract.update({ where: { id: contract.id }, data: { priceAmount: quote.amount } });

  if (contract.status === "ROUTED") {
    await transitionStatus(contract.id, "ROUTED", "PAYMENT_REQUIRED", {
      actor: params.actor,
      reason: "service-choice",
      metadata: { lawyerServiceSelected: lawyerRequested },
    });
  }

  await recordAudit({
    action: "LAWYER_SERVICE_SELECTED",
    entityType: "Contract",
    entityId: contract.id,
    ...actorAudit(params.actor),
    metadata: { lawyerServiceSelected: lawyerRequested, price: quote.amount, currency: quote.currency },
  });

  return { price: quote.amount, currency: quote.currency, lawyerRequested };
}

/** Cancels a case that has not reached a final state. Never deletes history. */
export async function cancelContract(params: {
  contractId: string;
  actor: CaseActor;
  reason?: string;
}): Promise<void> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true },
  });

  assertCaseAccess(contract, params.actor);
  if (contract.status === "FINAL" || contract.status === "CANCELLED") throw new Error("CONTRACT_NOT_CANCELLABLE");

  assertTransition(contract.status, "CANCELLED");

  // An authorized hold is voided through the provider-signed path first —
  // locally cancelling the row would leave real (or mocked) funds in limbo.
  try {
    const released = await releaseAuthorizedPaymentInSandbox({ contractId: contract.id });
    if (released.released) {
      logger.info("payment.hold_released_on_cancel", { contractId: contract.id });
    }
  } catch (error) {
    logger.warn("payment.hold_release_unavailable", {
      contractId: contract.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await db.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contract.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (contract.lawyerRequest) {
      await tx.lawyerRequest.update({ where: { id: contract.lawyerRequest.id }, data: { status: "CANCELLED" } });
    }
    // Anything still open locally (pending checkout, or a hold the provider
    // could not release) is closed as CANCELLED for the books. Rows the
    // provider already cancelled are deliberately untouched — audit keeps the
    // difference explicit.
    const openPayments = await tx.payment.findMany({
      where: { contractId: contract.id, status: { in: ["PENDING", "AUTHORIZED"] } },
      select: { id: true, status: true },
    });
    for (const row of openPayments) {
      await tx.payment.update({
        where: { id: row.id },
        data: {
          status: "CANCELLED",
          failureReason:
            row.status === "AUTHORIZED"
              ? `HOLD_CANCELLED_NOT_RELEASED: ${params.reason ?? "case-cancelled"}`
              : params.reason ?? "CASE_CANCELLED",
        },
      });
    }
  });

  await recordAudit({
    action: "CONTRACT_CANCELLED",
    entityType: "Contract",
    entityId: contract.id,
    ...actorAudit(params.actor),
    metadata: { reason: params.reason ?? "client-request", previousStatus: contract.status },
  });
}

export interface CreateCaseParams {
  actor: CaseActor;
  /** Contract type chosen in the public catalogue (business code, not a slug). */
  contractTypeCode: string;
  locale: AppLocale;
  title?: string;
  intentCode?: string | null;
}

export interface CreateCaseResult {
  contractId: string;
  reference: string;
  contractType: ContractTypeSummary;
  status: string;
  missingKeys: string[];
}

/**
 * Creates a case from a catalogue choice (§4, §14).
 *
 * Unlike `createContractRequest`, no free text is required: the visitor already
 * picked a document, so the AI plays no part in deciding what to prepare. The
 * case is created in DRAFT — owned either by the signed-in client or by the
 * anonymous guest session — and its questionnaire derives from the configured
 * fields and rule dependencies exactly like the authenticated flow.
 */
export async function createContractCase(params: CreateCaseParams): Promise<CreateCaseResult> {
  const contractType = await db.contractType.findFirst({
    where: { code: params.contractTypeCode, active: true, status: "ACTIVE" },
    select: {
      id: true,
      code: true,
      nameFr: true,
      nameAr: true,
      category: true,
      active: true,
      requiredFields: true,
    },
  });
  if (!contractType) throw new Error("CONTRACT_TYPE_UNRESOLVED");

  const reference = await nextContractReference();

  const contract = await db.contract.create({
    data: {
      reference,
      ...ownerColumnsFor(params.actor),
      contractTypeId: contractType.id,
      title: params.title?.trim() || `${contractType.nameFr} — ${reference}`,
      language: params.locale === "ar" ? "AR" : "FR",
      jurisdiction: PRIMARY_JURISDICTION,
      status: "DRAFT",
      intentCode: params.intentCode ?? null,
    },
  });

  await recordAudit({
    action: "CONTRACT_CREATED",
    entityType: "Contract",
    entityId: contract.id,
    ...actorAudit(params.actor),
    metadata: {
      reference,
      contractTypeCode: contractType.code,
      locale: params.locale,
      source: "catalogue",
      actorLabel: actorLabel(params.actor),
    },
  });

  const questionSet = await buildQuestionSetFor(contract.id, contractType);

  return {
    contractId: contract.id,
    reference,
    contractType,
    status: contract.status,
    missingKeys: questionSet.missingKeys,
  };
}

export interface SelectServiceParams {
  contractId: string;
  actor: CaseActor;
  /** Offer chosen by the client — validated against the routing decision (§15). */
  offerKey: ServiceOfferKey;
}

export interface SelectServiceResult {
  price: number;
  currency: string;
  offerKey: ServiceOfferKey;
  lawyerRequested: boolean;
  requiresSignature: boolean;
}

/**
 * Records the client's service choice (§15, §18).
 *
 * The routing decision — not the client — defines the allowed offers: choosing
 * self-service on a case whose rules require a lawyer is rejected here, and a
 * request created earlier for an *optional* review can still be withdrawn while it
 * is unassigned (nothing has been paid yet). The price always comes from
 * `quoteService`; an amount is never read from the request body.
 */
export async function selectContractService(params: SelectServiceParams): Promise<SelectServiceResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true },
  });

  assertCaseAccess(contract, params.actor);
  if (!contract.route) throw new Error("CONTRACT_NOT_ROUTED");
  if (contract.status !== "ROUTED" && contract.status !== "PAYMENT_REQUIRED") {
    throw new Error(`INVALID_CONTRACT_STATUS_FOR_SERVICE_CHOICE: ${contract.status}`);
  }

  const offers = buildServiceOffers({
    route: contract.route,
    currency: contract.priceCurrency,
    lawyerServiceSelected: Boolean(contract.lawyerRequest),
  });
  if (offers.blocked) throw new Error("ROUTE_NOT_PAYABLE");

  const selectedOffer = offers.offers.find((offer) => offer.key === params.offerKey);
  if (!selectedOffer) throw new Error("SERVICE_OFFER_NOT_ALLOWED");

  const choice = resolveOfferChoice(offers, selectedOffer.includesLawyer);
  if (!choice.accepted) throw new Error(choice.reason);

  let lawyerRequested = Boolean(contract.lawyerRequest);

  if (selectedOffer.includesLawyer && !contract.lawyerRequest) {
    await db.lawyerRequest.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        serviceType: contract.route === "LAWYER_OPTIONAL" ? "LAWYER_REVIEW" : "LAWYER_REQUIRED_SERVICE",
        status: "CREATED",
        requiresSignature: selectedOffer.includesSignature,
      },
    });
    lawyerRequested = true;
  }

  if (!selectedOffer.includesLawyer && contract.lawyerRequest) {
    // Only an unassigned request can be withdrawn; beyond that it is a real
    // engagement and a human has to handle the change.
    if (contract.lawyerRequest.status !== "CREATED") throw new Error("LAWYER_REVIEW_ALREADY_REQUESTED");
    assertLawyerRequestTransition(contract.lawyerRequest.status, "CANCELLED");
    await db.lawyerRequest.update({
      where: { id: contract.lawyerRequest.id },
      data: { status: "CANCELLED" },
    });
    lawyerRequested = false;
  }

  if (contract.lawyerRequest && contract.lawyerRequest.requiresSignature !== selectedOffer.includesSignature) {
    await db.lawyerRequest.update({
      where: { id: contract.lawyerRequest.id },
      data: { requiresSignature: selectedOffer.includesSignature },
    });
  }

  const quote = quoteService({
    route: contract.route,
    lawyerServiceSelected: lawyerRequested,
    signatureRequired: selectedOffer.includesSignature,
    currency: contract.priceCurrency,
  });

  await db.contract.update({ where: { id: contract.id }, data: { priceAmount: quote.amount } });

  if (contract.status === "ROUTED") {
    await transitionStatus(contract.id, "ROUTED", "PAYMENT_REQUIRED", {
      actor: params.actor,
      reason: "service-selection",
      metadata: { offerKey: params.offerKey, price: quote.amount },
    });
  }

  await recordAudit({
    action: "SERVICE_OFFER_SELECTED",
    entityType: "Contract",
    entityId: contract.id,
    ...actorAudit(params.actor),
    metadata: {
      offerKey: params.offerKey,
      route: contract.route,
      price: quote.amount,
      currency: quote.currency,
      lawyerRequested,
      requiresSignature: selectedOffer.includesSignature,
    },
  });

  return {
    price: quote.amount,
    currency: quote.currency,
    offerKey: params.offerKey,
    lawyerRequested,
    requiresSignature: selectedOffer.includesSignature,
  };
}
