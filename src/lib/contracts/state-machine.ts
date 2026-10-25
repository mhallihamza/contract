import type { ContractStatus, LawyerRequestStatus } from "@prisma/client";
import { LOG_EVENTS, logger } from "@/lib/logging";

/**
 * Central contract state machine (§37).
 *
 * Every status change in the application goes through `assertTransition`, so an
 * illegal transition (for example finalising a document whose signature rule is
 * still pending) fails loudly instead of silently corrupting the workflow.
 */

export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ["INFORMATION_REQUIRED", "READY_FOR_ROUTING", "CANCELLED"],
  INFORMATION_REQUIRED: ["READY_FOR_ROUTING", "CANCELLED"],
  READY_FOR_ROUTING: ["ROUTED", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  ROUTED: ["PAYMENT_REQUIRED", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  PAYMENT_REQUIRED: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["DOCUMENT_GENERATING", "VERIFICATION_IN_PROGRESS", "CANCELLED"],
  DOCUMENT_GENERATING: ["DRAFT_READY", "CANCELLED"],
  DRAFT_READY: ["LAWYER_PENDING", "FINAL", "CANCELLED"],
  // §8b — verification journey of a previously uploaded document. The report
  // can close the assisted tier; the lawyer tier continues through the
  // standard lawyer branch and attestation.
  VERIFICATION_IN_PROGRESS: ["REPORT_DELIVERED", "LAWYER_PENDING", "CANCELLED"],
  REPORT_DELIVERED: ["LAWYER_PENDING", "FINAL", "CANCELLED"],
  LAWYER_PENDING: ["LAWYER_REVIEW", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  LAWYER_REVIEW: ["CHANGES_REQUESTED", "VALIDATED", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  CHANGES_REQUESTED: ["DRAFT_READY", "LAWYER_REVIEW", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  MANUAL_REVIEW_REQUIRED: ["ROUTED", "DRAFT_READY", "CANCELLED"],
  VALIDATED: ["SIGNATURE_PENDING", "FINAL", "CANCELLED"],
  SIGNATURE_PENDING: ["SIGNED", "MANUAL_REVIEW_REQUIRED", "CANCELLED"],
  SIGNED: ["FINAL"],
  FINAL: [],
  CANCELLED: [],
};

export const LAWYER_REQUEST_TRANSITIONS: Record<LawyerRequestStatus, LawyerRequestStatus[]> = {
  CREATED: ["ASSIGNMENT_PENDING", "CANCELLED"],
  ASSIGNMENT_PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["INFORMATION_REQUESTED", "CHANGES_REQUESTED", "READY_FOR_VALIDATION", "REJECTED", "CANCELLED"],
  INFORMATION_REQUESTED: ["UNDER_REVIEW", "CANCELLED"],
  CHANGES_REQUESTED: ["UNDER_REVIEW", "CANCELLED"],
  READY_FOR_VALIDATION: ["VALIDATED", "UNDER_REVIEW", "CANCELLED"],
  VALIDATED: ["SIGNATURE_PENDING", "COMPLETED", "CANCELLED"],
  SIGNATURE_PENDING: ["SIGNED", "CANCELLED"],
  SIGNED: ["COMPLETED"],
  REJECTED: ["CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

export function canTransition(from: ContractStatus, to: ContractStatus): boolean {
  return CONTRACT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: ContractStatus): ContractStatus[] {
  return CONTRACT_TRANSITIONS[from] ?? [];
}

export function assertTransition(from: ContractStatus, to: ContractStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    logger.error(LOG_EVENTS.stateTransitionRejected, { from, to, allowed: allowedTransitions(from) });
    throw new InvalidStateTransitionError(from, to);
  }
}

export function canTransitionLawyerRequest(from: LawyerRequestStatus, to: LawyerRequestStatus): boolean {
  return LAWYER_REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertLawyerRequestTransition(from: LawyerRequestStatus, to: LawyerRequestStatus): void {
  if (from === to) return;
  if (!canTransitionLawyerRequest(from, to)) {
    logger.error(LOG_EVENTS.stateTransitionRejected, { from, to, entity: "LawyerRequest" });
    throw new InvalidStateTransitionError(from, to);
  }
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const CONTRACT_STATUS_TONE: Record<ContractStatus, StatusTone> = {
  DRAFT: "neutral",
  INFORMATION_REQUIRED: "warning",
  READY_FOR_ROUTING: "info",
  ROUTED: "info",
  PAYMENT_REQUIRED: "warning",
  PAYMENT_CONFIRMED: "info",
  DOCUMENT_GENERATING: "info",
  DRAFT_READY: "info",
  LAWYER_PENDING: "info",
  LAWYER_REVIEW: "info",
  CHANGES_REQUESTED: "warning",
  MANUAL_REVIEW_REQUIRED: "danger",
  VALIDATED: "success",
  SIGNATURE_PENDING: "warning",
  SIGNED: "success",
  FINAL: "success",
  VERIFICATION_IN_PROGRESS: "info",
  REPORT_DELIVERED: "success",
  CANCELLED: "neutral",
};

/** Contracts the client is expected to act on (dashboard §28). */
export const CLIENT_ACTION_STATUSES: ContractStatus[] = [
  "INFORMATION_REQUIRED",
  "PAYMENT_REQUIRED",
  "CHANGES_REQUESTED",
  "DRAFT_READY",
];

export function needsClientAction(status: ContractStatus): boolean {
  return CLIENT_ACTION_STATUSES.includes(status);
}

export function isTerminalStatus(status: ContractStatus): boolean {
  return allowedTransitions(status).length === 0;
}

export const OPEN_STATUSES: ContractStatus[] = [
  "DRAFT",
  "INFORMATION_REQUIRED",
  "READY_FOR_ROUTING",
  "ROUTED",
  "PAYMENT_REQUIRED",
  "PAYMENT_CONFIRMED",
  "DOCUMENT_GENERATING",
  "DRAFT_READY",
  "LAWYER_PENDING",
  "LAWYER_REVIEW",
  "CHANGES_REQUESTED",
  "MANUAL_REVIEW_REQUIRED",
  "VALIDATED",
  "SIGNATURE_PENDING",
  "SIGNED",
  "VERIFICATION_IN_PROGRESS",
  "REPORT_DELIVERED",
];
