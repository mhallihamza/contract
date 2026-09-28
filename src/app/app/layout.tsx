import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Client area layout (§28).
 *
 * Any signed-in user can reach the client shell; a lawyer or admin is redirected
 * to their own workspace instead of being shown a client-only navigation.
 */
export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "CLIENT") redirect(roleHome(user.role));

  return (
    <AppShell user={user} area="client">
      {children}
    </AppShell>
  );
}
