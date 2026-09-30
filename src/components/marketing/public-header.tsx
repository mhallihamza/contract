import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Header of the public experience (§6).
 *
 * Typographic mark on the left, five centred entries (Solutions, Comment ça
 * marche, Pour les entreprises, Pour les professionnels, Ressources), then the
 * language switch, a discreet "Connexion" link and the accent "Commencer"
 * button — both in #1E3A6E. Section entries are absolute anchors (`/#…`) so the
 * same bar works on the catalogue, the product pages and the assistant.
 * Starting a document never requires an account.
 */
export function PublicHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    solutions: string;
    how: string;
    businesses: string;
    professionals: string;
    resources: string;
    signIn: string;
    mySpace: string;
    start: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  const links: { href: string; label: string }[] = [
    { href: "/#solutions", label: nav.solutions },
    { href: "/#how-it-works", label: nav.how },
    { href: "/#business", label: nav.businesses },
    { href: "/#validation", label: nav.professionals },
    { href: "/#faq", label: nav.resources },
  ];

  const mobileLinks: { href: string; label: string }[] = [
    ...links,
    { href: "/contracts", label: nav.start },
    user ? { href: roleHome(user.role), label: nav.mySpace } : { href: "/sign-in", label: nav.signIn },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="font-serif text-xl font-semibold tracking-tight text-navy">
            {appConfig.brand.name}
          </span>
        </Link>

        <nav
          className="mx-auto hidden items-center gap-7 text-sm text-ink-muted lg:flex"
          aria-label="Navigation"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-navy">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <LanguageSwitcher currentLocale={locale} />

          {user ? null : (
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-accent transition-colors hover:text-navy sm:block"
            >
              {nav.signIn}
            </Link>
          )}

          <Button
            asChild
            className="h-11 rounded-[11px] bg-accent px-5 text-white shadow-sm hover:bg-navy focus-visible:ring-accent"
          >
            <Link href={user ? roleHome(user.role) : "/contracts"}>
              {user ? nav.mySpace : nav.start}
            </Link>
          </Button>

          <div className="lg:hidden">
            <MobileNav links={mobileLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
