import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shape of the single contract document that illustrates the hero (§7). */
export interface HeroDocument {
  title: string;
  preamble: string;
  sections: readonly { n: string; title: string }[];
  status: string;
  ready: string;
}

/**
 * Hero of the homepage (§6–§8) — the promise on the left, one contract
 * document on the right.
 *
 * The document is drawn with HTML and CSS only: white sheet, 1px hairline,
 * 12px radius, restrained shadow, realistic proportions and generous
 * whitespace. No photograph, no dashboard, no gradient, no glow. Every string
 * comes from the dictionary so the Arabic page states the same promise.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  reassurance,
  document,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  reassurance: string;
  document: HeroDocument;
}) {
  return (
    <section data-landing-section="hero" className="bg-canvas">
      <div className="container-page grid items-center gap-16 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:py-24">
        {/* Left — the promise. */}
        <div className="max-w-[650px] space-y-6">
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span dir="auto">{eyebrow}</span>
          </p>

          <h1 className="text-[2.625rem] font-semibold leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.25rem] lg:text-[3.75rem]">
            {title}
          </h1>

          <p className="max-w-[34rem] text-[17px] leading-[1.6] text-ink-muted sm:text-lg" dir="auto">
            {subtitle}
          </p>

          <div className="flex flex-col items-start gap-5 pt-1 sm:flex-row sm:items-center sm:gap-7">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[10px] bg-navy-deep px-6 text-[15px] font-semibold text-white transition hover:bg-navy-mid focus-visible:ring-navy-deep"
            >
              <Link href="/assistant">
                {primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>

            <Link
              href="/#services"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-navy underline-offset-4 transition-colors hover:text-navy-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-deep"
            >
              {secondaryCta}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <p className="pt-1 text-[14px] text-ink-muted" dir="auto">
            {reassurance}
          </p>
        </div>

        {/* Right — the document itself is the visual. */}
        <div className="relative mx-auto w-full max-w-[30rem]">
          <article className="rounded-[12px] border border-hairline bg-surface px-7 pb-9 pt-8 shadow-[0_1px_2px_rgba(23,43,58,0.04),0_14px_34px_rgba(23,43,58,0.07)] sm:px-9 sm:pt-10">
            <header className="border-b border-hairline pb-5 text-center">
              <p
                className="text-[14px] font-semibold uppercase leading-snug tracking-[0.08em] text-navy sm:text-[15px]"
                dir="auto"
              >
                {document.title}
              </p>
              <p className="mt-2.5 text-[12px] text-ink-muted" dir="auto">
                {document.preamble}
              </p>
            </header>

            <div className="mt-7 space-y-6">
              {document.sections.map((section) => (
                <div key={section.n} className="space-y-2.5">
                  <p className="flex items-baseline gap-3 text-[13px] font-semibold text-navy">
                    <span className="tabular-nums text-[12px] font-medium text-ink-muted">
                      {section.n}
                    </span>
                    <span dir="auto">{section.title}</span>
                  </p>
                  <span aria-hidden className="block h-[3px] w-full rounded-full bg-hairline" />
                  <span aria-hidden className="block h-[3px] w-[88%] rounded-full bg-hairline" />
                  <span aria-hidden className="block h-[3px] w-[64%] rounded-full bg-hairline" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-hairline pt-4">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                dir="auto"
              >
                {document.ready}
              </p>
            </div>
          </article>

          {/* One small status element, resting on the edge of the sheet. */}
          <p className="absolute -bottom-4 start-4 flex items-center gap-2 rounded-[10px] border border-hairline bg-surface px-3.5 py-2 text-[12px] font-medium text-navy shadow-[0_8px_20px_rgba(23,43,58,0.08)] sm:start-6">
            <Check className="h-3.5 w-3.5 shrink-0 text-navy-deep" strokeWidth={2.25} aria-hidden />
            <span dir="auto">{document.status}</span>
          </p>
        </div>
      </div>
    </section>
  );
}