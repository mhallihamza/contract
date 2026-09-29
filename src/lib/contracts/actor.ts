import type { UserRole } from "@prisma/client";

/**
 * Who is acting on a case (§8, §38).
 *
 * The platform is catalogue-first: a visitor must be able to answer the
 * questionnaire, preview and pay **before** any account exists. Every domain
 * operation therefore receives a `CaseActor`, and the ownership decision is taken
 * here — never in a component, never from client input.
 */
export interface UserActor {
  kind: "user";
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
}

export interface GuestActor {
  kind: "guest";
  /** GuestSession.id — the anonymous owner of the case. */
  sessionId: string;
  /** The single case this session owns (1:1 by construction). */
  contractId: string;
  email: string | null;
  locale: "fr" | "ar";
}

export type CaseActor = UserActor | GuestActor;

export function isGuestActor(actor: CaseActor): actor is GuestActor {
  return actor.kind === "guest";
}

/** Audit columns for an actor. A guest has no user row, but the decision is still
 * traceable: the session id is stored in the metadata and the role is recorded as
 * CLIENT so the audit trail reads like any other client action. */
export function actorAudit(actor: CaseActor): {
  actorId: string | null;
  actorRole: UserRole | null;
  guestSessionId?: string;
} {
  return isGuestActor(actor)
    ? { actorId: null, actorRole: "CLIENT", guestSessionId: actor.sessionId }
    : { actorId: actor.id, actorRole: actor.role };
}

/** Database column value for `createdById` / `uploadedById` / `Payment.userId`. */
export function actorId(actor: CaseActor): string | null {
  return isGuestActor(actor) ? null : actor.id;
}

/** Database column value for `createdByRole` / audit `actorRole`. */
export function actorRole(actor: CaseActor): UserRole | null {
  return isGuestActor(actor) ? "CLIENT" : actor.role;
}

/** Human label used in metadata (guests are labelled by session, never by name). */
export function actorLabel(actor: CaseActor): string {
  return isGuestActor(actor) ? `guest:${actor.sessionId}` : `${actor.role}:${actor.id}`;
}

/** The owner columns a case (or case-owned row) must carry for this actor. */
export function ownerColumnsFor(actor: CaseActor): {
  clientId: string | null;
  guestSessionId: string | null;
  customerEmail: string | null;
} {
  return isGuestActor(actor)
    ? { clientId: null, guestSessionId: actor.sessionId, customerEmail: actor.email }
    : { clientId: actor.id, guestSessionId: null, customerEmail: actor.email || null };
}

export interface CaseOwnership {
  clientId: string | null;
  guestSessionId: string | null;
}

export type AccessReason =
  | "CLIENT_OWNER"
  | "GUEST_OWNER"
  | "STAFF"
  | "CLIENT_NOT_OWNER"
  | "GUEST_SESSION_MISMATCH";

/**
 * Pure ownership decision: a client (or guest session) may only reach their own
 * case; staff accounts keep their role-based access. Exported separately from
 * `assertCaseAccess` so it can be unit-tested and audited without a database.
 */
export function caseAccessDecision(
  contract: CaseOwnership,
  actor: CaseActor,
): { allowed: boolean; reason: AccessReason } {
  if (isGuestActor(actor)) {
    if (!contract.guestSessionId || contract.guestSessionId !== actor.sessionId) {
      return { allowed: false, reason: "GUEST_SESSION_MISMATCH" };
    }
    return { allowed: true, reason: "GUEST_OWNER" };
  }
  if (actor.role !== "CLIENT") return { allowed: true, reason: "STAFF" };
  if (contract.clientId !== null && contract.clientId === actor.id) {
    return { allowed: true, reason: "CLIENT_OWNER" };
  }
  return { allowed: false, reason: "CLIENT_NOT_OWNER" };
}

export function canAccessCase(contract: CaseOwnership, actor: CaseActor): boolean {
  return caseAccessDecision(contract, actor).allowed;
}

/** Server-side guard used by every case operation. Throws `FORBIDDEN` on denial. */
export function assertCaseAccess(contract: CaseOwnership, actor: CaseActor): void {
  if (!caseAccessDecision(contract, actor).allowed) throw new Error("FORBIDDEN");
}

/** A guest actor must never be able to act outside the case it was issued for. */
export function assertSameCase(contractId: string, actor: CaseActor): void {
  if (isGuestActor(actor) && actor.contractId !== contractId) throw new Error("FORBIDDEN");
}
