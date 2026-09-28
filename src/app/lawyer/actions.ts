"use server";

import type { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requestMetadata } from "@/lib/audit/logger";
import { actorContext, type ActionState } from "@/lib/actions/state";
import { requireRoleAction } from "@/lib/auth/session";
import {
  acceptCase,
  declineCase,
  markReadyForValidation,
  rejectCase,
  requestClientInformation,
  saveLawyerDraft,
  validateCaseAsLawyer,
} from "@/lib/contracts/lawyer-workflow";
import { completeContractSignature, createContractSignatureRequest } from "@/lib/signatures/service";

/**
 * Lawyer workspace actions (§20, §21, §22).
 *
 * Each action re-authenticates as a staff role, passes the session actor to the
 * workflow (never a client-supplied id) and revalidates the workspace routes.
 */

const WORKSPACE_ROLES: UserRole[] = ["LAWYER", "LEGAL_REVIEWER", "ADMIN", "SUPER_ADMIN"];

const KNOWN_ERRORS = [
  "FORBIDDEN",
  "NO_LAWYER_REQUEST",
  "CONTRACT_NOT_EDITABLE",
  "SIGNATURE_ALREADY_COMPLETED",
  "CONTRACT_HAS_NO_VERSION",
  "CONTRACT_HAS_NO_DOCUMENT_TO_SIGN",
  "INVALID_PAYLOAD",
];

function describeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return KNOWN_ERRORS.find((candidate) => raw.startsWith(candidate)) ?? "UNEXPECTED_ERROR";
}

function refresh(contractId: string): void {
  revalidatePath(`/lawyer/workspace/${contractId}`);
  revalidatePath("/lawyer/workspace");
}

type Guard =
  | { ok: true; actor: ReturnType<typeof actorContext> }
  | { ok: false; state: ActionState };

async function guard(): Promise<Guard> {
  try {
    const user = await requireRoleAction(...WORKSPACE_ROLES);
    return { ok: true, actor: actorContext(user) };
  } catch {
    return { ok: false, state: { ok: false, error: "FORBIDDEN" } };
  }
}

export async function acceptCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");

  try {
    await acceptCase({ contractId, actor: auth.actor });
    refresh(contractId);
    return { ok: true, message: "ACCEPTED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function declineCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    const outcome = await declineCase({ contractId, actor: auth.actor, reason });
    refresh(contractId);
    return { ok: true, message: outcome.reassigned ? "REASSIGNED" : "DECLINED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function requestInformationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 3) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    await requestClientInformation({ contractId, actor: auth.actor, message });
    refresh(contractId);
    return { ok: true, message: "INFORMATION_REQUESTED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function saveDraftAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const changeSummary = String(formData.get("changeSummary") ?? "").trim();
  if (content.length < 20) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    const saved = await saveLawyerDraft({
      contractId,
      actor: auth.actor,
      content,
      changeSummary: changeSummary || "Revue par l'avocat",
    });
    refresh(contractId);
    return { ok: true, message: `v${saved.versionNumber}` };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function markReadyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");

  try {
    await markReadyForValidation({ contractId, actor: auth.actor });
    refresh(contractId);
    return { ok: true, message: "READY_FOR_VALIDATION" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function validateCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");

  try {
    await validateCaseAsLawyer({ contractId, actor: auth.actor });
    refresh(contractId);
    return { ok: true, message: "VALIDATED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function rejectCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    await rejectCase({ contractId, actor: auth.actor, reason });
    refresh(contractId);
    return { ok: true, message: "REJECTED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function requestSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const lawyerRequestId = String(formData.get("lawyerRequestId") ?? "");
  if (!lawyerRequestId) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    const outcome = await createContractSignatureRequest({
      contractId,
      lawyerRequestId,
      lawyerUserId: auth.actor.id,
      actorRole: auth.actor.role,
    });
    refresh(contractId);
    return { ok: true, message: outcome.method };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function completeSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (!auth.ok) return auth.state;
  const contractId = String(formData.get("contractId") ?? "");
  const signatureRequestId = String(formData.get("signatureRequestId") ?? "");
  if (!signatureRequestId) return { ok: false, error: "INVALID_PAYLOAD" };

  const metadata = await requestMetadata();

  try {
    await completeContractSignature({
      signatureRequestId,
      actorUserId: auth.actor.id,
      actorRole: auth.actor.role,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    refresh(contractId);
    return { ok: true, message: "SIGNED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

