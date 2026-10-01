import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Header of the public experience (§7).
 *
 * Typographic wordmark on the left, five understated entries centred
 * (Nos services, Contrats, Entreprises, Professionnels, Ressources), then the
 * language switch, a discreet "Se connecter" link and the dark navy
 * "Commencer" button. Section entries are absolute anchors (`/#…`) so the same
 * bar works on the catalogue, the product pages and the assistant. Starting a
 * request never requires an account.
 */
export function PublicHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    solutions: string;
    contracts: string;
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
    { href: "/#services", label: nav.solutions },
    { href: "/contracts", label: nav.contracts },
    { href: "/#business", label: nav.businesses },
    { href: "/#validation", label: nav.professionals },
    { href: "/#faq", label: nav.resources },
  ];

  const mobileLinks: { href: string; label: string }[] = [
    ...links,
    { href: "/assistant", label: nav.start },
    user ? { href: roleHome(user.role), label: nav.mySpace } : { href: "/sign-in", label: nav.signIn },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] w-full max-w-[77.5rem] items-center gap-4 px-5 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="text-[17px] font-bold tracking-[-0.01em] text-navy">
            {appConfig.brand.name}
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-7 text-[13.5px] text-ink-muted lg:flex" aria-label="Navigation">
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
              className="hidden text-[13.5px] font-medium text-navy transition-colors hover:text-accent sm:block"
            >
              {nav.signIn}
            </Link>
          )}

          <Button
            asChild
            className="h-10 rounded-[10px] bg-accent px-5 text-[13.5px] font-semibold text-white transition hover:bg-navy-mid focus-visible:ring-accent"
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
