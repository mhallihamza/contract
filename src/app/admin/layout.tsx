import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getCurrentUser, roleAtLeast } from "@/lib/auth/session";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Admin area shell (§31).
 *
 * Reviewer roles share the console: a legal reviewer must be able to inspect
 * routing decisions and the audit trail without being an administrator.
 */
export const metadata = { title: "Administration" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!roleAtLeast(user.role, "LEGAL_REVIEWER")) redirect(roleHome(user.role));

  return (
    <AppShell user={user} area="admin">
      {children}
    </AppShell>
  );
}
