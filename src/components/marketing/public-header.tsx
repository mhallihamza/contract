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
 * Typographic wordmark on the left, four understated entries in the middle —
 * Services, Contrats, Entreprises, Ressources — then the language switch, a
 * discreet "Se connecter" link and the dark "Commencer" button. 76px high,
 * one hairline underneath, no shadow: the page itself carries the composition.
 * Section entries are absolute anchors (`/#…`) so the same bar works on the
 * catalogue, the product pages and the assistant. Starting a request never
 * requires an account.
 */
export function PublicHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    services: string;
    contracts: string;
    businesses: string;
    resources: string;
    signIn: string;
    mySpace: string;
    start: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  const links: { href: string; label: string }[] = [
    { href: "/#services", label: nav.services },
    { href: "/contracts", label: nav.contracts },
    { href: "/#business", label: nav.businesses },
    { href: "/#faq", label: nav.resources },
  ];

  const mobileLinks: { href: string; label: string }[] = [
    ...links,
    { href: "/assistant", label: nav.start },
    user ? { href: roleHome(user.role), label: nav.mySpace } : { href: "/sign-in", label: nav.signIn },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-[76px] w-full items-center border-b border-hairline bg-canvas">
      <div className="container-page flex w-full items-center gap-4">
        <Link
          href="/"
          className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-deep"
        >
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-navy">
            {appConfig.brand.name}
          </span>
        </Link>

        <nav
          className="mx-auto hidden items-center gap-8 text-[13.5px] text-ink-muted lg:flex"
          aria-label="Navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-navy focus-visible:outline-none focus-visible:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <LanguageSwitcher currentLocale={locale} />

          {user ? null : (
            <Link
              href="/sign-in"
              className="hidden text-[13.5px] font-medium text-navy transition-colors hover:text-navy-deep sm:block"
            >
              {nav.signIn}
            </Link>
          )}

          <Button
            asChild
            className="h-10 rounded-[10px] bg-navy-deep px-5 text-[13.5px] font-semibold text-white transition hover:bg-navy-mid focus-visible:ring-navy-deep"
          >
            <Link href={user ? roleHome(user.role) : "/assistant"}>
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