/**
 * Guest session rules (§8).
 *
 * Deliberately dependency-free: no database, no `node:crypto`, no `server-only`
 * import. The lifecycle rules of an anonymous intake session are business rules,
 * so they are unit-tested directly and reused by the (server-only) session
 * service that persists them.
 */

export const GUEST_COOKIE = "wathiqa.guest";

/** 32 random bytes → 43 base64url characters. */
export const GUEST_TOKEN_BYTES = 32;
const BASE64URL_43 = /^[A-Za-z0-9_-]{43}$/;

export const DEFAULT_GUEST_TTL_HOURS = 168; // 7 days — long enough to finish a dossier

export interface GuestSessionLifecycle {
  expiresAt: Date;
  revokedAt?: Date | null;
  convertedAt?: Date | null;
}

export type GuestSessionState = "ACTIVE" | "EXPIRED" | "REVOKED" | "CONVERTED";

/** TTL from the environment, falling back to the documented default. */
export function guestTtlHours(source: Record<string, string | undefined> = process.env): number {
  const raw = Number(source.GUEST_SESSION_TTL_HOURS ?? DEFAULT_GUEST_TTL_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_GUEST_TTL_HOURS;
}

export function guestSessionExpiry(now: Date, ttlHours = guestTtlHours()): Date {
  return new Date(now.getTime() + ttlHours * 3600 * 1000);
}

export function guestSessionState(session: GuestSessionLifecycle, now = new Date()): GuestSessionState {
  if (session.revokedAt) return "REVOKED";
  if (session.convertedAt) return "CONVERTED";
  if (session.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return "ACTIVE";
}

/**
 * A converted session stays readable (the client just created an account) — only
 * revoked and expired sessions are refused.
 */
export function isGuestSessionUsable(session: GuestSessionLifecycle, now = new Date()): boolean {
  const state = guestSessionState(session, now);
  return state === "ACTIVE" || state === "CONVERTED";
}

/** Cheap shape check before hitting the database with an attacker-supplied token. */
export function looksLikeGuestToken(token: string | null | undefined): token is string {
  return typeof token === "string" && BASE64URL_43.test(token);
}

/** Where a guest resumes their dossier. */
export function guestResumePath(kind: "start" | "dossier" | "order", token: string): string {
  return `/${kind}/${token}`;
}
