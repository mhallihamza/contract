import Link from "next/link";
import { Scale } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Public navigation (§62).
 *
 * The header is auth-aware on the server: a signed-in visitor is offered their
 * role workspace instead of the sign-in link, and the language switcher always
 * reflects the cookie-driven locale.
 */
export function SiteHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    home: string;
    signIn: string;
    signUp: string;
    newContract: string;
    process: string;
    types: string;
    dashboard: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{appConfig.name}</span>
            <span className="text-[11px] text-muted-foreground" dir="auto">
              {appConfig.logo.text}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Navigation">
          <Link href="/#process" className="transition-colors hover:text-foreground">
            {nav.process}
          </Link>
          <Link href="/#types" className="transition-colors hover:text-foreground">
            {nav.types}
          </Link>
          {user ? (
            <Link href={roleHome(user.role)} className="transition-colors hover:text-foreground">
              {nav.dashboard}
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          {user ? (
            <Button asChild size="sm">
              <Link href="/app/contracts/new">{nav.newContract}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">{nav.signIn}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-in?mode=sign-up">{nav.signUp}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
