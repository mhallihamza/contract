import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { roleAtLeast } from "@/lib/auth/session";
import { transitionStatus, type ActorContext } from "@/lib/contracts/service";
import { assertLawyerRequestTransition } from "@/lib/contracts/state-machine";
import { declineAndReassign } from "@/lib/lawyers/assignment";
import { generateAndStoreDocument } from "@/lib/documents/service";
import { notifyUser } from "@/lib/notifications/service";

/**
 * Lawyer workspace workflow (§20, §21).
 *
 * The lawyer never touches the database directly: every action goes through the
 * state machines (contract + lawyer request), is audited, and notifies the client.
 * Internal validation and electronic signature remain two distinct operations.
 */

async function loadAssignedCase(contractId: string, actor: ActorContext) {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: contractId },
    include: { contractType: true, lawyerRequest: true, client: { select: { id: true, fullName: true, email: true } } },
  });

  const request = contract.lawyerRequest;
  const isAssigned = request?.lawyerId === actor.id;
  if (!isAssigned && !roleAtLeast(actor.role, "LEGAL_REVIEWER")) throw new Error("FORBIDDEN");
  if (!request) throw new Error("NO_LAWYER_REQUEST");

  return { contract, request };
}

/** Lawyer accepts the case: request → UNDER_REVIEW, contract → LAWYER_REVIEW. */
export async function acceptCase(params: { contractId: string; actor: ActorContext }): Promise<void> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);

  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");
  if (request.status === "ASSIGNED") {
    assertLawyerRequestTransition("ASSIGNED", "UNDER_REVIEW");
    await db.lawyerRequest.update({
      where: { id: request.id },
      data: { status: "UNDER_REVIEW", acceptedAt: new Date() },
    });
    await db.lawyerAssignment.updateMany({
      where: { lawyerRequestId: request.id, lawyerId: params.actor.id, status: "ASSIGNED" },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  }

  if (contract.status === "LAWYER_PENDING") {
    await transitionStatus(contract.id, "LAWYER_PENDING", "LAWYER_REVIEW", {
      actor: params.actor,
      reason: "lawyer-accepted",
    });
  }

  await recordAudit({
    action: "LAWYER_ACCEPTED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "LAWYER_ACCEPTED",
    title: "Votre dossier est en cours de revue",
    body: `Un avocat a accepté le dossier ${contract.reference} et en commence l'examen.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });
}

/** Lawyer declines: the platform immediately tries the next candidate (§19). */
export async function declineCase(params: {
  contractId: string;
  actor: ActorContext;
  reason: string;
}): Promise<{ reassigned: boolean; reason: string }> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");

  await recordAudit({
    action: "LAWYER_DECLINED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, reason: params.reason },
  });

  const outcome = await declineAndReassign({
    lawyerRequestId: request.id,
    lawyerUserId: params.actor.id,
    reason: params.reason,
  });

  if (outcome.assigned && outcome.candidate) {
    await db.lawyerRequest.update({ where: { id: request.id }, data: { dueAt: new Date(Date.now() + 48 * 3600 * 1000) } });
    await recordAudit({
      action: "ASSIGNMENT_REASSIGNED",
      entityType: "LawyerRequest",
      entityId: request.id,
      actorId: params.actor.id,
      actorRole: params.actor.role,
      metadata: { contractId: contract.id, lawyerUserId: outcome.candidate.userId, score: outcome.candidate.score },
    });
    await notifyUser({
      userId: outcome.candidate.userId,
      type: "LAWYER_ASSIGNED",
      title: "Nouveau dossier attribué",
      body: `Le dossier ${contract.reference} vous a été attribué après refus d'un confrère.`,
      href: `/lawyer/cases/${contract.id}`,
      contractId: contract.id,
    });
  } else {
    await notifyUser({
      userId: contract.clientId,
      type: "ASSIGNMENT_FAILED",
      title: "Recherche d'un avocat en cours",
      body: "Un avocat a refusé le dossier et l'attribution est relancée. Vous serez notifié dès qu'un avocat l'accepte.",
      href: `/app/contracts/${contract.id}`,
      contractId: contract.id,
    });
  }

  return { reassigned: outcome.assigned, reason: outcome.reason };
}

/** Lawyer asks the client for missing information (§21). */
export async function requestClientInformation(params: {
  contractId: string;
  actor: ActorContext;
  message: string;
}): Promise<void> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");
  assertLawyerRequestTransition(request.status, "INFORMATION_REQUESTED");

  await db.lawyerRequest.update({
    where: { id: request.id },
    data: { status: "INFORMATION_REQUESTED", informationRequest: params.message },
  });

  await recordAudit({
    action: "LAWYER_REQUESTED_INFORMATION",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, characters: params.message.length },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "INFORMATION_REQUESTED",
    title: "Informations complémentaires demandées",
    body: `L'avocat en charge du dossier ${contract.reference} demande des précisions. Consultez le dossier pour répondre.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });
}

/**
 * Lawyer edits the draft. A new immutable-aware version is created — the previous
 * version is never overwritten, and the lawyer's edit is attributed to them.
 */
export async function saveLawyerDraft(params: {
  contractId: string;
  actor: ActorContext;
  content: string;
  changeSummary: string;
}): Promise<{ versionId: string; versionNumber: number; documentId: string }> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: {
      contractType: true,
      lawyerRequest: true,
      parties: { orderBy: { position: "asc" } },
      fields: true,
      currentVersion: true,
    },
  });

  if (contract.lawyerRequest?.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");
  if (contract.status !== "LAWYER_REVIEW" && contract.status !== "CHANGES_REQUESTED") {
    throw new Error(`CONTRACT_NOT_EDITABLE: ${contract.status}`);
  }

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
      kind: "LAWYER_REVISED",
      createdById: params.actor.id,
      createdByRole: params.actor.role,
      content: params.content,
      templateVersionId: contract.currentVersion?.templateVersionId ?? null,
      changeSummary: params.changeSummary,
    },
  });

  const document = await generateAndStoreDocument({
    contractId: contract.id,
    ownerId: contract.clientId,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    documentType: "LAWYER_REVISED_DRAFT",
    contractVersionId: version.id,
    format: "docx",
    title: contract.title,
    body: params.content,
    language: contract.language === "AR" ? "ar" : "fr",
    reference: contract.reference,
    contractTypeFr: contract.contractType.nameFr,
    contractTypeAr: contract.contractType.nameAr,
    versionNumber,
    filenameSuffix: "avocat",
  });

  await db.contract.update({ where: { id: contract.id }, data: { currentVersionId: version.id } });
  await db.lawyerRequest.update({
    where: { id: contract.lawyerRequest.id },
    data: { draftVersionId: version.id },
  });

  await recordAudit({
    action: "DRAFT_EDITED",
    entityType: "ContractVersion",
    entityId: version.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, versionNumber, documentId: document.id },
  });

  return { versionId: version.id, versionNumber, documentId: document.id };
}

/** Lawyer signals the draft is complete and ready for validation. */
export async function markReadyForValidation(params: { contractId: string; actor: ActorContext }): Promise<void> {
  const { request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");
  if (request.status === "READY_FOR_VALIDATION") return;

  assertLawyerRequestTransition(request.status, "READY_FOR_VALIDATION");
  await db.lawyerRequest.update({ where: { id: request.id }, data: { status: "READY_FOR_VALIDATION" } });
  await recordAudit({
    action: "CONTRACT_UPDATED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: params.contractId, step: "READY_FOR_VALIDATION" },
  });
}

/**
 * Internal validation (§21) — distinct from an electronic signature: it records
 * that the lawyer reviewed and approved the content.
 */
export async function validateCaseAsLawyer(params: { contractId: string; actor: ActorContext }): Promise<void> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");
  if (contract.status !== "LAWYER_REVIEW" && contract.status !== "CHANGES_REQUESTED") {
    throw new Error(`CONTRACT_NOT_REVIEWABLE: ${contract.status}`);
  }

  if (request.status !== "READY_FOR_VALIDATION") {
    assertLawyerRequestTransition(request.status, "READY_FOR_VALIDATION");
    await db.lawyerRequest.update({ where: { id: request.id }, data: { status: "READY_FOR_VALIDATION" } });
  }
  assertLawyerRequestTransition("READY_FOR_VALIDATION", "VALIDATED");

  await db.lawyerRequest.update({
    where: { id: request.id },
    data: { status: "VALIDATED", validatedAt: new Date(), validatedById: params.actor.id },
  });

  await transitionStatus(contract.id, contract.status, "VALIDATED", {
    actor: params.actor,
    reason: "lawyer-internal-validation",
    metadata: { lawyerRequestId: request.id },
  });

  await recordAudit({
    action: "LAWYER_VALIDATED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, requiresSignature: request.requiresSignature },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "CONTRACT_VALIDATED",
    title: "Votre document a été validé",
    body: request.requiresSignature
      ? `Le contenu du dossier ${contract.reference} a été validé par l'avocat. La signature électronique est l'étape suivante.`
      : `Le contenu du dossier ${contract.reference} a été validé par l'avocat.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });
}

/** Lawyer asks the client to correct or complete the case. */
export async function requestContractChanges(params: {
  contractId: string;
  actor: ActorContext;
  message: string;
}): Promise<void> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");

  assertLawyerRequestTransition(request.status, "CHANGES_REQUESTED");
  await db.lawyerRequest.update({
    where: { id: request.id },
    data: { status: "CHANGES_REQUESTED", informationRequest: params.message },
  });

  if (contract.status === "LAWYER_REVIEW") {
    await transitionStatus(contract.id, "LAWYER_REVIEW", "CHANGES_REQUESTED", {
      actor: params.actor,
      reason: "lawyer-requested-changes",
    });
  }

  await recordAudit({
    action: "LAWYER_REQUESTED_INFORMATION",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, kind: "CHANGES_REQUESTED" },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "CHANGES_REQUESTED",
    title: "Des modifications sont demandées",
    body: `L'avocat a demandé des modifications sur le dossier ${contract.reference}. Consultez le dossier pour les traiter.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });
}

/** Lawyer refuses the case (out of scope, or information cannot be obtained). */
export async function rejectCase(params: {
  contractId: string;
  actor: ActorContext;
  reason: string;
}): Promise<void> {
  const { contract, request } = await loadAssignedCase(params.contractId, params.actor);
  if (request.lawyerId !== params.actor.id) throw new Error("FORBIDDEN");

  assertLawyerRequestTransition(request.status, "REJECTED");
  await db.lawyerRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: params.reason },
  });

  await transitionStatus(contract.id, contract.status, "CANCELLED", {
    actor: params.actor,
    reason: "lawyer-rejected",
    metadata: { reason: params.reason },
  });

  await recordAudit({
    action: "LAWYER_REJECTED",
    entityType: "LawyerRequest",
    entityId: request.id,
    actorId: params.actor.id,
    actorRole: params.actor.role,
    metadata: { contractId: contract.id, reason: params.reason },
  });

  await notifyUser({
    userId: contract.clientId,
    type: "ASSIGNMENT_FAILED",
    title: "Le dossier n'a pas pu être traité en ligne",
    body: `Le dossier ${contract.reference} a été refusé par l'avocat. Un administrateur vous contactera pour la suite à donner.`,
    href: `/app/contracts/${contract.id}`,
    contractId: contract.id,
  });
}
