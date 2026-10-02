import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";

/** Icon + destination of the two needs, in dictionary order (§9). */
const NEED_META = [
  { icon: FileText, href: "/assistant" },
  { icon: ShieldCheck, href: "/#review" },
];

/**
 * Two customer needs (§9) — the first fork of the page.
 *
 * A quiet editorial layout: eyebrow, question, one sentence, then two large
 * blocks separated by a single thin vertical line. No colourful cards, no
 * photography, two line icons. Each block leads to a real destination: the
 * request flow, or the review section.
 */
export function NeedsSection({
  eyebrow,
  title,
  subtitle,
  needs,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  needs: readonly { title: string; body: string; cta: string }[];
}) {
  return (
    <section id="besoin" data-landing-section="needs" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-14">
        <header className="max-w-2xl space-y-4">
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span dir="auto">{eyebrow}</span>
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
        </header>

        <ul className="grid border-t border-hairline pt-12 lg:grid-cols-2 lg:pt-14">
          {needs.map((need, index) => {
            const meta = NEED_META[index] ?? NEED_META[0];
            const Icon = meta.icon;
            return (
              <li
                key={need.title}
                className={
                  "pb-10 last:pb-0 lg:pb-0 " +
                  (index === 1 ? "lg:border-s lg:border-hairline lg:ps-14" : "lg:pe-14")
                }
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline">
                  <Icon className="h-5 w-5 text-navy-deep" strokeWidth={1.5} aria-hidden />
                </span>
                <h3 className="mt-6 text-[1.375rem] font-semibold tracking-[-0.01em] text-navy lg:text-[1.5rem]">
                  <span dir="auto">{need.title}</span>
                </h3>
                <p className="mt-3 max-w-sm text-[17px] leading-relaxed text-ink-muted" dir="auto">
                  {need.body}
                </p>
                <Link
                  href={meta.href}
                  className="group mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-navy-deep underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-deep"
                >
                  {need.cta}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}