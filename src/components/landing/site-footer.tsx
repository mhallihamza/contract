import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { WathiqaMark } from "@/components/marketing/wathiqa-mark";
import { appConfig } from "@/lib/config";

/** The footer's copy shape — `d.public.home.footer`, FR reference, AR mirror. */
export interface FooterLabels {
  tagline: string;
  popular: string;
  compliance: string;
  contact: string;
  popularLinks: readonly { label: string; target: string }[];
  laws: readonly string[];
  address: string;
  hours: string;
  phone: string;
  whatsapp: string;
  legal: string;
  privacy: string;
  copyright: string;
}

/**
 * Service links point at their real destination: the catalogue page carries
 * every act type, and the verifier is the simulator's second mode. Nothing in
 * the footer is decorative — each anchor leads somewhere a visitor can act.
 */
const SERVICE_HREF: Record<string, string> = {
  bail: "/contracts?template=contrat-location-habitation",
  cdi: "/contracts?template=contrat-travail-cdd",
  prestation: "/contracts?template=contrat-prestation-services",
  verify: "/#simulator",
};

/**
 * Footer of the public experience — the Wathiqa colophon.
 *
 * A deep-emerald band that closes every public page. The document mark and the
 * wordmark sit with the one-line promise; then the three columns a legal
 * services page owes its visitor — the popular services, the compliance frame
 * (the actual Moroccan texts the platform drafts against), and the contact
 * block with the seat, the hours and the phone. The bottom line carries the
 * legal / privacy links, the copyright and the honest demonstration notice.
 */
export function SiteFooter({ labels, rights }: { labels: FooterLabels; rights: string }) {
  return (
    <footer className="border-t border-navy-mid bg-navy-deep text-accent-tint">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column — mark, wordmark, the promise. */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <WathiqaMark className="h-8 w-8 text-brass" aria-hidden />
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                {appConfig.brand.name}
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-accent-tint/80" dir="auto">
              {labels.tagline}
            </p>
          </div>

          {/* Popular services — the acts a visitor came here for. */}
          <nav aria-label={labels.popular}>
            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-brass-bright">
              {labels.popular}
            </h3>
            <ul className="space-y-2 text-sm">
              {labels.popularLinks.map((link) => (
                <li key={link.target}>
                  <Link
                    href={SERVICE_HREF[link.target] ?? "/contracts"}
                    className="text-accent-tint/85 underline-offset-4 transition-colors hover:text-white hover:underline"
                    dir="auto"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Compliance — the legal frame the documents are drafted against. */}
          <div>
            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-brass-bright">
              {labels.compliance}
            </h3>
            <ul className="space-y-2 text-sm text-accent-tint/85">
              {labels.laws.map((law) => (
                <li key={law} dir="auto">
                  {law}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — seat, hours, phone, WhatsApp. */}
          <div>
            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-brass-bright">
              {labels.contact}
            </h3>
            <ul className="space-y-2.5 text-sm text-accent-tint/85">
              <li className="flex items-start gap-2">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-contrast" />
                <span dir="auto">{labels.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-contrast" />
                <span dir="auto">{labels.hours}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-contrast" />
                <a
                  href={`tel:${labels.phone.replace(/\s/g, "")}`}
                  className="underline-offset-4 transition-colors hover:text-white hover:underline"
                  dir="auto"
                >
                  {labels.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom line — legal, privacy, copyright, and the honest notice. */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-mid/70 pt-6 text-xs text-accent-tint/70 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/legal"
              className="underline-offset-4 transition-colors hover:text-white hover:underline"
              dir="auto"
            >
              {labels.legal}
            </Link>
            <Link
              href="/legal#privacy"
              className="underline-offset-4 transition-colors hover:text-white hover:underline"
              dir="auto"
            >
              {labels.privacy}
            </Link>
            <span className="text-accent-tint/50" dir="auto">
              {rights}
            </span>
          </div>
          <p dir="auto">{labels.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

