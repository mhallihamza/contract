import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { Clock, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Button } from "@/components/ui/button";
import { WathiqaMark } from "@/components/marketing/wathiqa-mark";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Header of the public experience — the Wathiqa bar.
 *
 * Two stacked bands, exactly as the brand page wears them: the deep emerald
 * announcement strip (legal framework note, WhatsApp line, opening hours) and
 * the sticky white bar under it — document mark + wordmark and its mono
 * tagline on the left, the five section anchors in the middle, then the
 * FR | العربية pill, the sign-in link and the emerald "Créer mon acte"
 * action. Section entries are absolute anchors (`/#…`) so the same bar works
 * on the catalogue, the product pages and the assistant. Starting a request
 * never requires an account.
 */
export function PublicHeader({
  locale,
  nav,
  announcement,
  user,
}: {
  locale: AppLocale;
  nav: {
    how: string;
    catalogue: string;
    pricing: string;
    why: string;
    faq: string;
    signIn: string;
    mySpace: string;
    createActe: string;
    whatsappDirect: string;
    brand: string;
    tagline: string;
  };
  announcement: {
    badge: string;
    note: string;
    whatsapp: string;
    hours: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  const links: { href: string; label: string }[] = [
    { href: "/#how-it-works", label: nav.how },
    { href: "/contracts", label: nav.catalogue },
    { href: "/#services", label: nav.pricing },
    { href: "/#comparison", label: nav.why },
    { href: "/#faq", label: nav.faq },
  ];

  // The WhatsApp channel only exists when the operator configured a number:
  // no placeholder number is ever shown (it would look like a real contact).
  const whatsappHref = appConfig.whatsappNumber
    ? `https://wa.me/${appConfig.whatsappNumber}`
    : null;

  const mobileLinks: { href: string; label: string; external?: boolean }[] = [
    ...links,
    ...(whatsappHref ? [{ href: whatsappHref, label: nav.whatsappDirect, external: true }] : []),
    user
      ? { href: roleHome(user.role), label: nav.mySpace }
      : { href: "/sign-in", label: nav.signIn },
  ];

  return (
    <>
      {/* Announcement strip — the legal framework, the WhatsApp line, the hours. */}
      <div
        className="border-b border-navy-mid bg-navy-deep text-xs text-accent-tint"
        data-landing-section="announcement"
      >
        <div className="container-page flex flex-col items-center justify-between gap-2 py-2 text-center sm:flex-row sm:text-start">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-tint">
              {announcement.badge}
            </span>
            <span>{announcement.note}</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-medium">
            {whatsappHref ? (
              <>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-accent-contrast"
                >
                  <WhatsAppGlyph className="h-3.5 w-3.5 text-accent-contrast" />
                  <span>{announcement.whatsapp}</span>
                </a>
                <span aria-hidden className="hidden text-accent md:inline">
                  |
                </span>
              </>
            ) : null}
            <span className="flex items-center gap-1.5 text-accent-tint/90">
              <Clock className="h-3 w-3" aria-hidden />
              {announcement.hours}
            </span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-hairline bg-white/95 backdrop-blur-md">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          {/* Brand: the document mark, the wordmark, the mono tagline. */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <WathiqaMark className="h-10 w-10 rounded-xl shadow-md transition-transform group-hover:scale-105" />
            <span className="block">
              <span className="block text-xl font-bold tracking-tight text-navy-deep">
                {nav.brand}
              </span>
              <span className="-mt-1 block font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                {nav.tagline}
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex"
            aria-label="Navigation"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />

            <Button
              asChild
              className="hidden items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-mid focus-visible:ring-accent sm:inline-flex"
            >
              <Link href={user ? roleHome(user.role) : "/contracts"}>
                <Zap className="h-3.5 w-3.5 text-accent-tint" aria-hidden />
                {user ? nav.mySpace : nav.createActe}
              </Link>
            </Button>

            {user ? null : (
              <Link
                href="/sign-in"
                className="hidden text-[13.5px] font-medium text-ink-soft transition-colors hover:text-accent lg:block"
              >
                {nav.signIn}
              </Link>
            )}

            <div className="md:hidden">
              <MobileNav links={mobileLinks} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

/**
 * The WhatsApp glyph: lucide ships no brand icons, so the one brand mark the
 * header needs is drawn inline — everything else on the bar is lucide.
 */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" />
    </svg>
  );
}