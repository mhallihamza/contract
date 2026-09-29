import Link from "next/link";
import { Scale } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Header of the public experience (§14).
 *
 * Catalogue-first navigation on desktop (Documents, Comment ça marche, Aide)
 * and on mobile (logo + menu). "Connexion" is offered to returning customers
 * but is never a prerequisite for starting a document.
 */
export function PublicHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    contracts: string;
    how: string;
    help: string;
    signIn: string;
    mySpace: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  const mobileLinks: { href: string; label: string }[] = [
    { href: "/contracts", label: nav.contracts },
    { href: "/#process", label: nav.how },
    { href: "/assistant", label: nav.help },
    user
      ? { href: roleHome(user.role), label: nav.mySpace }
      : { href: "/sign-in", label: nav.signIn },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
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
          <Link href="/contracts" className="transition-colors hover:text-foreground">
            {nav.contracts}
          </Link>
          <Link href="/#process" className="transition-colors hover:text-foreground">
            {nav.how}
          </Link>
          <Link href="/assistant" className="transition-colors hover:text-foreground">
            {nav.help}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          <div className="hidden md:block">
            {user ? (
              <Button asChild size="sm">
                <Link href={roleHome(user.role)}>{nav.mySpace}</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">{nav.signIn}</Link>
              </Button>
            )}
          </div>
          <div className="md:hidden">
            <MobileNav links={mobileLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
