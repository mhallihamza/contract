import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { logger } from "@/lib/logging";

/**
 * Session-based authentication backed by Prisma (§4: Supabase Auth is not
 * mandatory; the schema is designed so another provider can be layered in).
 *
 * Security model (§38): the cookie is httpOnly and stores a random token whose
 * SHA-256 hash is persisted. Every authorization decision happens server-side;
 * the client never supplies its own role, id or ownership.
 */

export const SESSION_COOKIE = "wathiqa.session";

function sessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET?.trim() || "development-session-secret";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${sessionSecret()}:${token}`).digest("hex");
}

function ttlHours(): number {
  const raw = Number(process.env.SESSION_TTL_HOURS ?? 720);
  return Number.isFinite(raw) && raw > 0 ? raw : 720;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  preferredLanguage: "AR" | "FR" | "EN";
  status: string;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlHours() * 3600 * 1000);
  const headerBag = await headers();

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipAddress: headerBag.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: headerBag.get("user-agent") ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session
      .updateMany({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
      .catch((error) => logger.warn("session.revoke_failed", { error: String(error) }));
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Next.js signals "this route must be dynamic" by throwing a special error. It must
 * never be swallowed here: a page that depends on the session would otherwise be
 * rendered (and possibly cached) as if nobody were signed in.
 */
function isDynamicUsageError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

/** Resolves the signed-in user, or null. Never trust client-supplied data. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
    if (session.user.status !== "ACTIVE") return null;

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
      preferredLanguage: session.user.preferredLanguage,
      status: session.user.status,
    };
  } catch (error) {
    if (isDynamicUsageError(error)) throw error;
    logger.warn("session.lookup_failed", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

const ROLE_RANK: Record<UserRole, number> = {
  CLIENT: 0,
  LAWYER: 1,
  LEGAL_REVIEWER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/** True when `role` is at least as privileged as `required`. */
export function roleAtLeast(role: UserRole, required: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/** Server-side guard for pages and actions. Redirects to sign-in when absent. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/app/dashboard?denied=1");
  return user;
}

/** Server action variant: throws instead of redirecting. */
export async function requireUserAction(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRoleAction(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUserAction();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export async function recordSignIn(userId: string, role: UserRole): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
  await recordAudit({ action: "USER_SIGNED_IN", entityType: "User", entityId: userId, actorId: userId, actorRole: role });
}
