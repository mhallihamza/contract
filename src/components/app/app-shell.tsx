import Link from "next/link";
import { Bell, Scale } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { getServerI18n } from "@/lib/i18n/server";
import type { SessionUser } from "@/lib/auth/session";
import { unreadNotificationCount } from "@/lib/notifications/service";
import { appConfig } from "@/lib/config";

/**
 * Authenticated shell (§28, §36).
 *
 * The navigation offered depends on the area, never on client input: rendering is
 * server-side, and the pages themselves re-check the role before showing data.
 */
export async function AppShell({
  user,
  area,
  children,
}: {
  user: SessionUser;
  area: "client" | "lawyer" | "admin";
  children: React.ReactNode;
}) {
  const { locale, d } = await getServerI18n();
  const unread = await unreadNotificationCount(user.id).catch(() => 0);

  const links =
    area === "client"
      ? [
          { href: "/app/dashboard", label: d.common.nav.dashboard },
          { href: "/app/contracts", label: d.common.nav.contracts },
          { href: "/app/contracts/new", label: d.common.nav.newContract },
          { href: "/app/documents", label: d.common.nav.documents },
        ]
      : area === "lawyer"
        ? [
            { href: "/lawyer/workspace", label: d.common.nav.lawyerWorkspace },
            { href: "/lawyer/workspace?filter=review", label: d.lawyer.myWorkload },
          ]
        : [
            { href: "/admin/dashboard", label: d.admin.nav.dashboard },
            { href: "/admin/dashboard#routing", label: d.admin.nav.routing },
            { href: "/admin/dashboard#knowledge", label: d.admin.nav.legalRules },
            { href: "/admin/dashboard#audit", label: d.admin.nav.auditLogs },
          ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={area === "client" ? "/app/dashboard" : area === "lawyer" ? "/lawyer/workspace" : "/admin/dashboard"} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scale className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold">{appConfig.name}</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex" aria-label="Navigation">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline" dir="auto">
              {user.fullName} · {d.statuses.role[user.role]}
            </span>
            <Link href={area === "client" ? "/app/notifications" : "#"} className="relative">
              <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
              {unread > 0 ? (
                <Badge variant="destructive" className="absolute -end-2 -top-2 h-4 min-w-4 justify-center px-1 text-[10px]">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              ) : null}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
            <SignOutButton label={d.common.nav.signOut} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-border/60 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 text-xs text-muted-foreground sm:px-6">
          <p dir="auto">{d.common.disclaimers.notLegalAdvice}</p>
          <p dir="auto">{d.common.poweredBy}</p>
        </div>
      </footer>
    </div>
  );
}
