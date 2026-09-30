import Link from "next/link";
import { Camera, MessageCircle, Share2 } from "lucide-react";
import { appConfig } from "@/lib/config";

/**
 * Public footer (§18).
 *
 * Deep-navy band, typographic brand mark and five link columns (Produit /
 * Solutions / Ressources / Entreprise / Légal). Every link points at a real
 * destination — catalogue, assistant, section anchor, sign-in or the legal page
 * — so the footer never becomes a list of dead ends. The demonstration
 * disclosure stays visible in every locale.
 */
export function SiteFooter({
  labels,
  social,
  rights,
}: {
  labels: {
    tagline: string;
    product: string;
    solutions: string;
    resources: string;
    company: string;
    legal: string;
    links: Record<string, string>;
    socialTitle: string;
  };
  social: readonly { href: string; label: string; icon: "share" | "message" | "camera" }[];
  rights: string;
}) {
  const socialIcons = { share: Share2, message: MessageCircle, camera: Camera } as const;

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: labels.product,
      links: [
        { href: "/contracts", label: labels.links.catalogue },
        { href: "/assistant", label: labels.links.assistant },
        { href: "/#how-it-works", label: labels.links.howItWorks },
        { href: "/#security", label: labels.links.security },
      ],
    },
    {
      title: labels.solutions,
      links: [
        { href: "/contracts?category=RENTAL", label: labels.links.immobilier },
        { href: "/contracts?category=SERVICES", label: labels.links.commercial },
        { href: "/contracts?category=CONFIDENTIALITY", label: labels.links.entreprise },
        { href: "/assistant", label: labels.links.describe },
      ],
    },
    {
      title: labels.resources,
      links: [
        { href: "/#faq", label: labels.links.faq },
        { href: "/#validation", label: labels.links.validation },
        { href: `mailto:${appConfig.supportEmail}`, label: labels.links.contact },
      ],
    },
    {
      title: labels.company,
      links: [
        { href: "/#business", label: labels.links.dashboard },
        { href: "/sign-in", label: labels.links.signIn },
        { href: "/legal#demonstration", label: labels.links.demo },
      ],
    },
    {
      title: labels.legal,
      links: [
        { href: "/legal#mentions", label: labels.links.notice },
        { href: "/legal#terms", label: labels.links.terms },
        { href: "/legal#privacy", label: labels.links.privacy },
        { href: "/legal#cookies", label: labels.links.cookies },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-navy-deep text-white" data-landing-section="footer">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))]">
          <div className="space-y-4">
            <p className="font-serif text-xl font-semibold tracking-tight text-white">
              {appConfig.brand.name}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-white/60" dir="auto">
              {labels.tagline}
            </p>
            <ul className="flex gap-2" aria-label={labels.socialTitle}>
              {social.map((item) => {
                const Icon = socialIcons[item.icon];
                return (
                  <li key={item.href + item.label}>
                    <a
                      href={item.href}
                      aria-label={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {column.title}
              </p>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-white/75 transition-colors hover:text-white"
                      dir="auto"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-white/55 sm:flex-row sm:px-6">
          <p dir="auto">{rights}</p>
          <p dir="ltr">{appConfig.supportEmail}</p>
        </div>
      </div>
    </footer>
  );
}
