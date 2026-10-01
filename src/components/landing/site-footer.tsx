import Link from "next/link";
import { appConfig } from "@/lib/config";

/**
 * Public footer (§23).
 *
 * Four columns — SERVICES / PLATEFORME / ENTREPRISE / LÉGAL — on the deep
 * navy band. Every link points at a real destination: catalogue deep links,
 * section anchors, the contact address from the app configuration, or the
 * legal page. No invented social accounts, addresses or phone numbers; the
 * demonstration disclosure stays visible in every locale.
 */
export function SiteFooter({
  labels,
  rights,
}: {
  labels: {
    tagline: string;
    services: string;
    platform: string;
    company: string;
    legal: string;
    links: {
      servicePrestation: string;
      serviceCommercial: string;
      serviceTravail: string;
      serviceRelecture: string;
      serviceEntreprise: string;
      howItWorks: string;
      businesses: string;
      professionals: string;
      resources: string;
      about: string;
      contact: string;
      faq: string;
      notice: string;
      privacy: string;
      terms: string;
    };
  };
  rights: string;
}) {
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: labels.services,
      links: [
        { href: "/contracts?category=SERVICES", label: labels.links.servicePrestation },
        { href: "/contracts?category=PARTNERSHIP", label: labels.links.serviceCommercial },
        { href: "/contracts?category=EMPLOYMENT", label: labels.links.serviceTravail },
        { href: "/#review", label: labels.links.serviceRelecture },
        { href: "/contracts?category=CONFIDENTIALITY", label: labels.links.serviceEntreprise },
      ],
    },
    {
      title: labels.platform,
      links: [
        { href: "/#how-it-works", label: labels.links.howItWorks },
        { href: "/#business", label: labels.links.businesses },
        { href: "/#validation", label: labels.links.professionals },
        { href: "/#faq", label: labels.links.resources },
      ],
    },
    {
      title: labels.company,
      links: [
        { href: "/#why", label: labels.links.about },
        { href: `mailto:${appConfig.supportEmail}`, label: labels.links.contact },
        { href: "/#faq", label: labels.links.faq },
      ],
    },
    {
      title: labels.legal,
      links: [
        { href: "/legal#mentions", label: labels.links.notice },
        { href: "/legal#privacy", label: labels.links.privacy },
        { href: "/legal#terms", label: labels.links.terms },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-navy-deep text-white" data-landing-section="footer">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <div className="space-y-4">
            <p className="text-xl font-semibold tracking-[-0.01em] text-white">
              {appConfig.brand.name}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-white/60" dir="auto">
              {labels.tagline}
            </p>
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
                      className="text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
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
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-white/55 sm:flex-row">
          <p dir="auto">
            © {new Date().getFullYear()} {appConfig.brand.name}
          </p>
          <p dir="auto">{rights}</p>
        </div>
      </div>
    </footer>
  );
}
