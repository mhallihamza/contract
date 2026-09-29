import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { logger } from "@/lib/logging";
import {
  GUEST_COOKIE,
  GUEST_TOKEN_BYTES,
  guestSessionExpiry,
  guestSessionState,
  isGuestSessionUsable,
  looksLikeGuestToken,
  type GuestSessionState,
} from "./rules";

/**
 * Guest intake sessions (§8).
 *
 * The product is catalogue-first, and this service is what makes that safe:
 *   • the token is 32 random bytes and only its SHA-256 hash is stored;
 *   • the token travels in an httpOnly cookie *and* in the URL (so a link sent by
 *     e-mail keeps working on another device) and is always verified server-side;
 *   • expiry, revocation and conversion are decided here, never by the browser.
 */

export interface GuestSessionSummary {
  id: string;
  contractTypeId: string | null;
  contractId: string | null;
  email: string | null;
  locale: "fr" | "ar";
  expiresAt: Date;
  state: GuestSessionState;
}

function toLanguage(locale: "fr" | "ar"): "AR" | "FR" {
  return locale === "ar" ? "AR" : "FR";
}

/**
 * Hashes a guest token. Domain-separated from the signed-in session tokens and
 * salted with the same secret, so a database dump alone cannot be replayed.
 */
export function hashGuestToken(token: string): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim() || "development-session-secret";
  return createHash("sha256").update(`guest:${secret}:${token}`).digest("hex");
}

/** Creates the anonymous session and returns the raw token exactly once. */
export async function issueGuestSession(params: {
  contractTypeId: string | null;
  locale: "fr" | "ar";
}): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const token = randomBytes(GUEST_TOKEN_BYTES).toString("base64url");
  const expiresAt = guestSessionExpiry(new Date());
  const headerBag = await headers();

  const session = await db.guestSession.create({
    data: {
      tokenHash: hashGuestToken(token),
      contractTypeId: params.contractTypeId,
      locale: toLanguage(params.locale),
      expiresAt,
      ipAddress: headerBag.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: headerBag.get("user-agent") ?? null,
    },
  });

  await recordAudit({
    action: "GUEST_SESSION_CREATED",
    entityType: "GuestSession",
    entityId: session.id,
    metadata: { contractTypeId: params.contractTypeId, locale: params.locale, expiresAt: expiresAt.toISOString() },
  });

  logger.info("guest.session_created", { sessionId: session.id, contractTypeId: params.contractTypeId });

  return { sessionId: session.id, token, expiresAt };
}

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/** Resolves a raw token to a usable session, or null. Never throws. */
export async function resolveGuestSession(token: string | null | undefined): Promise<GuestSessionSummary | null> {
  if (!looksLikeGuestToken(token)) return null;

  try {
    const session = await db.guestSession.findUnique({
      where: { tokenHash: hashGuestToken(token) },
      include: { contract: { select: { id: true } } },
    });
    if (!session) return null;

    if (!isGuestSessionUsable(session)) {
      logger.info("guest.session_unusable", { sessionId: session.id, state: guestSessionState(session) });
      return null;
    }

    if (!session.lastSeenAt || Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      await db.guestSession
        .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
        .catch(() => undefined);
    }

    return {
      id: session.id,
      contractTypeId: session.contractTypeId,
      contractId: session.contract?.id ?? null,
      email: session.email,
      locale: session.locale === "AR" ? "ar" : "fr",
      expiresAt: session.expiresAt,
      state: guestSessionState(session),
    };
  } catch (error) {
    logger.warn("guest.resolve_failed", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/** URL token wins; the cookie is the fallback (reloads, download links). */
export async function resolveGuestRequest(token?: string | null): Promise<GuestSessionSummary | null> {
  const direct = await resolveGuestSession(token ?? null);
  if (direct) return direct;
  if (typeof token === "string" && token.includes(".")) {
    const signed = await resolveGuestBySignedLink(token);
    if (signed) return signed;
  }
  const store = await cookies();
  return resolveGuestSession(store.get(GUEST_COOKIE)?.value ?? null);
}

export async function setGuestCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearGuestCookie(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}

/** Marks the anonymous session as converted once an account owns the case. */
export async function convertGuestSession(sessionId: string, userId: string): Promise<void> {
  await db.guestSession.update({
    where: { id: sessionId },
    data: { convertedAt: new Date(), convertedUserId: userId },
  });
  await recordAudit({
    action: "GUEST_SESSION_CONVERTED",
    entityType: "GuestSession",
    entityId: sessionId,
    actorId: userId,
    actorRole: "CLIENT",
  });
}

export async function revokeGuestSession(sessionId: string): Promise<void> {
  await db.guestSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
}

/**
 * Stateless signed dossier link used in e-mails: `<sessionId>.<hmac>`.
 *
 * Asynchronous events (a lawyer validating the case hours later, a signature
 * being completed) happen when the raw token is long gone, so the e-mail link
 * cannot be the token itself. A keyed HMAC of the session id gives a link that is
 * verifiable server-side without storing anything extra and unguessable without
 * the application secret.
 */
export function guestOrderLink(sessionId: string): string {
  return `${sessionId}.${signGuestLink(sessionId)}`;
}

function signGuestLink(sessionId: string): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim() || "development-session-secret";
  return createHmac("sha256", secret).update(`guest-link:${sessionId}`).digest("hex").slice(0, 32);
}

/** Returns the session id of a valid signed link, or null. */
export function verifyGuestOrderLink(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const sessionId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signGuestLink(sessionId);
  if (expected.length !== signature.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature)) ? sessionId : null;
}

/** Resolves a signed dossier link (`/order/<sessionId>.<hmac>`). */
export async function resolveGuestBySignedLink(value: string): Promise<GuestSessionSummary | null> {
  const sessionId = verifyGuestOrderLink(value);
  if (!sessionId) return null;

  const session = await db.guestSession.findUnique({
    where: { id: sessionId },
    include: { contract: { select: { id: true } } },
  });
  if (!session || !isGuestSessionUsable(session)) return null;

  return {
    id: session.id,
    contractTypeId: session.contractTypeId,
    contractId: session.contract?.id ?? null,
    email: session.email,
    locale: session.locale === "AR" ? "ar" : "fr",
    expiresAt: session.expiresAt,
    state: guestSessionState(session),
  };
}

/** Housekeeping: flags sessions that passed their expiry (called by admin/cron). */
export async function expireStaleGuestSessions(now = new Date()): Promise<number> {
  const stale = await db.guestSession.findMany({
    where: { expiresAt: { lte: now }, revokedAt: null },
    select: { id: true },
    take: 200,
  });
  if (stale.length === 0) return 0;
  await db.guestSession.updateMany({
    where: { id: { in: stale.map((session) => session.id) } },
    data: { revokedAt: now },
  });
  await recordAudit({
    action: "GUEST_SESSION_EXPIRED",
    entityType: "GuestSession",
    metadata: { count: stale.length },
  });
  return stale.length;
}
