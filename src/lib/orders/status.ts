import type { ContractStatus, PaymentStatus, RoutingRoute } from "@prisma/client";

/**
 * Order view model (§18, §39).
 *
 * The lifecycle itself lives in exactly one place — the contract state machine.
 * An "order status" is a *derived, read-only* projection of the real backend
 * state, so the customer tracking page can never show progress that did not
 * happen: every value below is computed from the stored contract, routing and
 * payment rows.
 */

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "AWAITING_LAWYER"
  | "AWAITING_SIGNATURE"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderStatusInput {
  contractStatus: ContractStatus;
  route: RoutingRoute | null;
  paymentStatus: PaymentStatus | null;
}

const AWAITING_LAWYER: ContractStatus[] = [
  "LAWYER_PENDING",
  "LAWYER_REVIEW",
  "CHANGES_REQUESTED",
  "MANUAL_REVIEW_REQUIRED",
];

export function deriveOrderStatus(input: OrderStatusInput): OrderStatus {
  if (input.paymentStatus === "REFUNDED") return "REFUNDED";
  if (input.contractStatus === "CANCELLED") return "CANCELLED";
  if (input.contractStatus === "FINAL") return "COMPLETED";

  if (input.contractStatus === "SIGNATURE_PENDING") return "AWAITING_SIGNATURE";
  if (AWAITING_LAWYER.includes(input.contractStatus)) return "AWAITING_LAWYER";

  if (
    input.paymentStatus === "PAID" &&
    (input.contractStatus === "PAYMENT_CONFIRMED" ||
      input.contractStatus === "DOCUMENT_GENERATING" ||
      input.contractStatus === "DRAFT_READY" ||
      input.contractStatus === "VALIDATED" ||
      input.contractStatus === "SIGNED")
  ) {
    return input.contractStatus === "PAYMENT_CONFIRMED" ? "PAID" : "PROCESSING";
  }

  return "PENDING_PAYMENT";
}

export type TimelineStepKey = "INFORMATION" | "PAYMENT" | "DRAFT" | "LAWYER" | "SIGNATURE" | "FINAL";
export type TimelineStepState = "DONE" | "CURRENT" | "UPCOMING" | "SKIPPED";

export interface TimelineStep {
  key: TimelineStepKey;
  state: TimelineStepState;
}

export interface OrderTimelineInput {
  contractStatus: ContractStatus;
  route: RoutingRoute | null;
  /** Draft version exists (a ContractVersion row). */
  hasDraft: boolean;
  /** A lawyer request exists on this case. */
  hasLawyerRequest: boolean;
  /** The configured rules require a signature ceremony. */
  signatureRequired: boolean;
}

/** Ordered, deterministic steps of a dossier — never fabricated progress. */
export function buildOrderTimeline(input: OrderTimelineInput): TimelineStep[] {
  const informationStarted = input.contractStatus !== "DRAFT";
  const informationDone = !["DRAFT", "INFORMATION_REQUIRED"].includes(input.contractStatus);

  const paymentDone = [
    "PAYMENT_CONFIRMED",
    "DOCUMENT_GENERATING",
    "DRAFT_READY",
    "LAWYER_PENDING",
    "LAWYER_REVIEW",
    "CHANGES_REQUESTED",
    "VALIDATED",
    "SIGNATURE_PENDING",
    "SIGNED",
    "FINAL",
  ].includes(input.contractStatus);
  const paymentCancelled = input.contractStatus === "CANCELLED";
  const paymentPending = ["ROUTED", "PAYMENT_REQUIRED", "READY_FOR_ROUTING", "MANUAL_REVIEW_REQUIRED"].includes(
    input.contractStatus,
  );

  const draftDone = input.hasDraft;
  const lawyerStageReached = input.hasLawyerRequest;

  const finalDone = input.contractStatus === "FINAL";
  const signatureReached = input.contractStatus === "SIGNATURE_PENDING" || input.contractStatus === "SIGNED" || finalDone;

  const steps: TimelineStep[] = [];

  steps.push({
    key: "INFORMATION",
    state: informationDone ? "DONE" : informationStarted ? "CURRENT" : "UPCOMING",
  });

  steps.push({
    key: "PAYMENT",
    state: paymentDone ? "DONE" : paymentPending ? "CURRENT" : paymentCancelled ? "SKIPPED" : "UPCOMING",
  });

  steps.push({
    key: "DRAFT",
    state: draftDone ? (lawyerStageReached || finalDone ? "DONE" : "CURRENT") : "UPCOMING",
  });

  if (input.hasLawyerRequest || input.signatureRequired) {
    const lawyerDone = ["VALIDATED", "SIGNATURE_PENDING", "SIGNED", "FINAL"].includes(input.contractStatus);
    steps.push({
      key: "LAWYER",
      state: lawyerDone ? "DONE" : input.hasLawyerRequest ? "CURRENT" : "UPCOMING",
    });
  } else {
    steps.push({ key: "LAWYER", state: "SKIPPED" });
  }

  if (input.signatureRequired) {
    const signatureDone = ["SIGNED", "FINAL"].includes(input.contractStatus);
    steps.push({
      key: "SIGNATURE",
      state: signatureDone ? "DONE" : signatureReached ? "CURRENT" : "UPCOMING",
    });
  } else {
    steps.push({ key: "SIGNATURE", state: "SKIPPED" });
  }

  steps.push({
    key: "FINAL",
    state: finalDone ? "DONE" : "UPCOMING",
  });

  return steps;
}
