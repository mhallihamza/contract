import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  FileUser,
  Handshake,
  ShieldCheck,
} from "lucide-react";

/** Icon + destination of the six services, in dictionary order (§10). */
const SERVICE_META = [
  { icon: FileText, href: "/contracts?category=SERVICES" },
  { icon: Handshake, href: "/contracts?category=PARTNERSHIP" },
  { icon: Briefcase, href: "/contracts?category=EMPLOYMENT" },
  { icon: Building2, href: "/contracts?category=RENTAL" },
  { icon: FileUser, href: "/contracts?category=CONFIDENTIALITY" },
  { icon: ShieldCheck, href: "/#review" },
];

/**
 * Services catalogue (§10).
 *
 * A bordered editorial index — six flat white cells on one hairline grid, each
 * with a small number, a title, one short sentence and an arrow. No coloured
 * cards, no photography: this is a professional-services page, not a SaaS
 * feature wall. Every entry links to a real destination.
 */
export function ServicesSection({
  eyebrow,
  title,
  services,
}: {
  eyebrow: string;
  title: string;
  services: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <section id="services" data-landing-section="services" className="bg-canvas py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span dir="auto">{eyebrow}</span>
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
        </header>

        <ul className="grid border-s border-t border-hairline sm:grid-cols-2">
          {services.map((service, index) => {
            const meta = SERVICE_META[index] ?? SERVICE_META[0];
            const Icon = meta.icon;
            return (
              <li key={service.n} className="flex">
                <Link
                  href={meta.href}
                  className="group flex h-full w-full flex-col gap-4 border-b border-e border-hairline bg-white p-7 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-deep lg:p-9"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[12px] font-semibold tabular-nums tracking-[0.12em] text-ink-muted">
                      {service.n}
                    </span>
                    <Icon className="h-5 w-5 shrink-0 text-navy-deep" strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-navy" dir="auto">
                    {service.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink-muted" dir="auto">
                    {service.body}
                  </p>
                  <span className="mt-auto pt-2">
                    <ArrowRight
                      className="h-4 w-4 text-navy-deep transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}