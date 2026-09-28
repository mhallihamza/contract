import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Lawyer area shell (§19, §28).
 *
 * Only staff roles reach the workspace; a client who lands here is sent back to
 * their own home instead of seeing an empty page.
 */
export const metadata = { title: "Espace avocat" };

export default async function LawyerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!["LAWYER", "LEGAL_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    redirect(roleHome(user.role));
  }

  return (
    <AppShell user={user} area="lawyer">
      {children}
    </AppShell>
  );
}
