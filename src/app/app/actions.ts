"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserAction, type SessionUser } from "@/lib/auth/session";
import { actorContext, type ActionState } from "@/lib/actions/state";
import { logger } from "@/lib/logging";
import { getServerLocale } from "@/lib/i18n/server";
import {
  cancelContract,
  chooseLawyerService,
  createContractRequest,
  routeContract,
  saveContractAnswers,
} from "@/lib/contracts/service";
import { DraftValidationError, finalizeContract, provideRequestedInformation } from "@/lib/contracts/drafting";
import { settleContractPaymentInSandbox, startContractPayment } from "@/lib/contracts/payments";
import { markNotificationsRead } from "@/lib/notifications/service";

/**
 * Client-facing server actions (§30).
 *
 * Every action re-authenticates server-side, passes the session actor (never a
 * client-supplied id or role) to the domain services, and revalidates the
 * affected route so the UI reflects the new state.
 */

/** Maps domain errors to a message key the UI can localise. */
function describeError(error: unknown): string {
  if (error instanceof DraftValidationError) return "DRAFT_VALIDATION_FAILED";
  const raw = error instanceof Error ? error.message : String(error);
  const known = [
    "FORBIDDEN",
    "INTENT_TEXT_TOO_SHORT",
    "CONTRACT_TYPE_UNRESOLVED",
    "NO_ACTIVE_TEMPLATE_VERSION",
    "NO_PENDING_PAYMENT",
    "CONTRACT_NOT_CANCELLABLE",
    "CONTRACT_NOT_FINALIZABLE",
    "LAWYER_SIGNATURE_REQUIRED_BEFORE_FINALIZATION",
    "SERVICE_CHOICE_NOT_APPLICABLE",
    "LAWYER_REVIEW_ALREADY_REQUESTED",
    "UNAUTHENTICATED",
  ];
  const match = known.find((candidate) => raw.startsWith(candidate));
  return match ?? "UNEXPECTED_ERROR";
}

export async function createIntakeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user: SessionUser;
  try {
    user = await requireUserAction();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED", redirectTo: "/sign-in" };
  }

  const text = String(formData.get("text") ?? "").trim();
  const contractTypeCode = String(formData.get("contractTypeCode") ?? "").trim();
  if (text.length < 3) return { ok: false, error: "INTENT_TEXT_TOO_SHORT" };

  const locale = await getServerLocale();

  try {
    const result = await createContractRequest({
      actor: actorContext(user),
      text,
      locale,
      contractTypeCode: contractTypeCode || null,
    });
    revalidatePath("/app/dashboard");
    revalidatePath("/app/contracts");
    return { ok: true, message: result.reference, redirectTo: `/app/contracts/${result.contractId}` };
  } catch (error) {
    logger.warn("intake.failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: describeError(error) };
  }
}

export async function saveAnswersAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");
  const raw = String(formData.get("answers") ?? "{}");

  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "INVALID_PAYLOAD" };
  }

  try {
    const result = await saveContractAnswers({ contractId, actor: actorContext(user), values: answers });
    revalidatePath(`/app/contracts/${contractId}`);
    return {
      ok: true,
      message: result.status,
      missingFields: result.missingKeys,
    };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function runRoutingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");

  try {
    const result = await routeContract({ contractId, actor: actorContext(user) });
    revalidatePath(`/app/contracts/${contractId}`);
    revalidatePath("/app/dashboard");
    return { ok: true, message: result.decision.route };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function chooseServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");
  const wantsLawyer = String(formData.get("lawyerServiceSelected") ?? "false") === "true";

  try {
    const choice = await chooseLawyerService({
      contractId,
      actor: actorContext(user),
      lawyerServiceSelected: wantsLawyer,
    });
    revalidatePath(`/app/contracts/${contractId}`);
    return { ok: true, message: `${choice.price} ${choice.currency}` };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function startPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");

  try {
    const result = await startContractPayment({ contractId, actor: actorContext(user) });
    revalidatePath(`/app/contracts/${contractId}`);
    return { ok: true, message: `${result.amount} ${result.currency}` };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function settlePaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");

  try {
    const result = await settleContractPaymentInSandbox({ contractId, actor: actorContext(user) });
    revalidatePath(`/app/contracts/${contractId}`);
    revalidatePath("/app/dashboard");
    return { ok: result.paid, message: result.message, error: result.paid ? undefined : "PAYMENT_NOT_SETTLED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function finalizeContractAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");

  try {
    const result = await finalizeContract({ contractId, actor: actorContext(user) });
    revalidatePath(`/app/contracts/${contractId}`);
    revalidatePath("/app/dashboard");
    revalidatePath("/app/documents");
    return { ok: true, message: `v${result.versionNumber}` };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function cancelContractAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  try {
    await cancelContract({ contractId, actor: actorContext(user), reason: reason || undefined });
    revalidatePath(`/app/contracts/${contractId}`);
    revalidatePath("/app/dashboard");
    return { ok: true, message: "CANCELLED" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function provideInformationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const contractId = String(formData.get("contractId") ?? "");
  const text = String(formData.get("information") ?? "").trim();
  if (text.length < 2) return { ok: false, error: "INVALID_PAYLOAD" };

  try {
    await provideRequestedInformation({ contractId, actor: actorContext(user), text });
    revalidatePath(`/app/contracts/${contractId}`);
    return { ok: true, message: "OK" };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/** Redirect helper kept explicit so the intake action stays free of `redirect` side effects. */
export async function goToContract(contractId: string): Promise<void> {
  redirect(`/app/contracts/${contractId}`);
}

/** Marks the signed-in user's notifications as read (§44). */
export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUserAction();
  await markNotificationsRead(user.id);
  revalidatePath("/app/notifications");
  revalidatePath("/app/dashboard");
}
