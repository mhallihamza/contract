import { describe, expect, it } from "vitest";
import type { ContractStatus } from "@prisma/client";
import {
  CLIENT_ACTION_STATUSES,
  CONTRACT_STATUS_TONE,
  CONTRACT_TRANSITIONS,
  InvalidStateTransitionError,
  OPEN_STATUSES,
  allowedTransitions,
  assertLawyerRequestTransition,
  assertTransition,
  canTransition,
  isTerminalStatus,
  needsClientAction,
} from "@/lib/contracts/state-machine";

/**
 * State machine invariants (§37).
 *
 * These are the guarantees the rest of the application relies on: no workflow may
 * skip a configured step (in particular the signature), and a rejected transition
 * must fail loudly.
 */

describe("contract status machine", () => {
  it("accepts the configured chain and ignores no-op transitions", () => {
    expect(() => assertTransition("DRAFT", "INFORMATION_REQUIRED")).not.toThrow();
    expect(() => assertTransition("PAYMENT_REQUIRED", "PAYMENT_CONFIRMED")).not.toThrow();
    expect(() => assertTransition("FINAL", "FINAL")).not.toThrow();
    expect(canTransition("ROUTED", "PAYMENT_REQUIRED")).toBe(true);
  });

  it("refuses transitions that skip a step", () => {
    expect(() => assertTransition("READY_FOR_ROUTING", "FINAL")).toThrow(InvalidStateTransitionError);
    expect(() => assertTransition("DRAFT_READY", "SIGNED")).toThrow(InvalidStateTransitionError);
    expect(() => assertTransition("PAYMENT_REQUIRED", "DRAFT_READY")).toThrow(InvalidStateTransitionError);
  });

  it("never finalises a signature-required case before it is signed", () => {
    expect(canTransition("SIGNATURE_PENDING", "FINAL")).toBe(false);
    expect(canTransition("SIGNED", "FINAL")).toBe(true);
  });

  it("publishes a tone and an explicit transition list for every status", () => {
    const statuses = Object.keys(CONTRACT_TRANSITIONS) as ContractStatus[];
    for (const status of statuses) {
      expect(CONTRACT_STATUS_TONE[status], `tone missing for ${status}`).toBeTruthy();
      expect(Array.isArray(CONTRACT_TRANSITIONS[status])).toBe(true);
    }
  });

  it("keeps FINAL and CANCELLED terminal, and out of the open set", () => {
    expect(isTerminalStatus("FINAL")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(allowedTransitions("FINAL")).toHaveLength(0);
    expect(OPEN_STATUSES).not.toContain("FINAL");
    expect(OPEN_STATUSES).not.toContain("CANCELLED");
  });

  it("allows cancellation until the document is signed", () => {
    const cancellable = OPEN_STATUSES.filter((status) => status !== "SIGNED");
    for (const status of cancellable) {
      expect(canTransition(status, "CANCELLED"), `${status} should be cancellable`).toBe(true);
    }
    expect(canTransition("SIGNED", "CANCELLED")).toBe(false);
    expect(canTransition("FINAL", "CANCELLED")).toBe(false);
  });

  it("flags exactly the statuses that need a client decision", () => {
    expect(needsClientAction("PAYMENT_REQUIRED")).toBe(true);
    expect(needsClientAction("INFORMATION_REQUIRED")).toBe(true);
    expect(needsClientAction("LAWYER_REVIEW")).toBe(false);
    for (const status of CLIENT_ACTION_STATUSES) {
      expect(needsClientAction(status)).toBe(true);
    }
  });
});

describe("lawyer request status machine", () => {
  it("follows assignment → review → validation → signature → completion", () => {
    expect(() => assertLawyerRequestTransition("ASSIGNED", "UNDER_REVIEW")).not.toThrow();
    expect(() => assertLawyerRequestTransition("UNDER_REVIEW", "READY_FOR_VALIDATION")).not.toThrow();
    expect(() => assertLawyerRequestTransition("READY_FOR_VALIDATION", "VALIDATED")).not.toThrow();
    expect(() => assertLawyerRequestTransition("SIGNED", "COMPLETED")).not.toThrow();
  });

  it("refuses to validate or sign a request that never reached the lawyer", () => {
    expect(() => assertLawyerRequestTransition("CREATED", "VALIDATED")).toThrow(InvalidStateTransitionError);
    expect(() => assertLawyerRequestTransition("ASSIGNED", "SIGNED")).toThrow(InvalidStateTransitionError);
    expect(() => assertLawyerRequestTransition("REJECTED", "COMPLETED")).toThrow(InvalidStateTransitionError);
  });
});
