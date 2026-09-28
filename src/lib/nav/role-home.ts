import type { UserRole } from "@prisma/client";

/**
 * Role → home route (§36).
 *
 * A single mapping shared by the landing page, the sign-in redirect and the
 * server guards, so a role never lands on the wrong dashboard.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  CLIENT: "/app/dashboard",
  LAWYER: "/lawyer/workspace",
  LEGAL_REVIEWER: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

export function roleHome(role: UserRole): string {
  return ROLE_HOME[role] ?? "/app/dashboard";
}
