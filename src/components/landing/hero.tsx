import Link from "next/link";
import { ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WathiqaMark } from "@/components/marketing/wathiqa-mark";
import { appConfig } from "@/lib/config";

/**
 * The sample bail the right column typesets: the first page of a multi-page
 * contract, never a one-pager and never an official State document.
 */
export interface HeroDocument {
  ref: string;
  title: string;
  law: string;
  badge: string;
  pages: string;
  partiesLabel: string;
  party1: string;
  party2: string;
  articles: readonly { title: string; body: string }[];
  sommaireLabel: string;
  sommaireItems: readonly string[];
  timestamp: string;
}

/**
 * Hero of the homepage — the Wathiqa stage.
 *
 * Left: the trust pill, the two-line promise with its italic emerald accent,
 * the three statutory reference chips, the two actions and the proof row.
 * Right: a stack of pages — the front sheet typesets the first page of an
 * eight-page residential lease over two rotated sheets peeking out from
 * behind, a summary strip of the full contract, then a fade to paper.
 * Background: the deep emerald gradient with the white dot lattice.
 * Every string comes from the dictionary so the Arabic page mirrors it RTL.
 */
export function Hero({
  badge,
  titleLine1,
  titleAccent,
  subtitle,
  chips,
  primaryCta,
  secondaryCta,
  metrics,
  document,
}: {
  badge: string;
  titleLine1: string;
  titleAccent: string;
  subtitle: string;
  chips: readonly string[];
  primaryCta: string;
  secondaryCta: string;
  metrics: readonly { value: string; label: string }[];
  document: HeroDocument;
}) {
  return (
    <section
      data-landing-section="hero"
      className="relative overflow-hidden bg-gradient-to-b from-navy-deep via-navy-mid to-navy-deep pb-20 pt-12 text-white"
    >
      {/* The dot lattice of the brand page, purely decorative. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
      />

      <div className="container-page relative z-10 grid items-center gap-12 lg:grid-cols-12">
        {/* Left — the promise. */}
        <div className="space-y-6 text-center lg:col-span-7 lg:text-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-strong/60 bg-accent/80 px-3 py-1 text-xs font-medium text-accent-tint">
            <ShieldCheck className="h-4 w-4 text-accent-contrast" aria-hidden />
            <span dir="auto">{badge}</span>
          </p>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            <span dir="auto">{titleLine1}</span>
            <br />
            <span className="font-normal italic text-accent-contrast" dir="auto">
              {titleAccent}
            </span>
          </h1>

          <p className="max-w-2xl text-base font-light leading-relaxed text-accent-tint sm:text-lg" dir="auto">
            {subtitle}
          </p>

          {/* The three statutory references. */}
          <div className="grid grid-cols-1 gap-3 text-left text-xs font-medium text-accent-tint sm:grid-cols-3">
            {chips.map((chip) => (
              <div
                key={chip}
                className="flex items-center gap-2 rounded-lg border border-accent/60 bg-navy-mid/60 p-2.5"
              >
                <CircleCheck className="h-4 w-4 shrink-0 text-accent-contrast" aria-hidden />
                <span dir="auto">{chip}</span>
              </div>
            ))}
          </div>

          {/* Actions. */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
            <Button
              asChild
              size="lg"
              className="w-full rounded-xl bg-accent-bright px-8 py-4 text-sm font-bold text-navy-deep shadow-xl transition hover:bg-accent-contrast focus-visible:ring-accent-bright sm:w-auto"
            >
              <Link href="/contracts">
                <span dir="auto">{primaryCta}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>

            {appConfig.whatsappNumber ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 px-6 py-4 text-sm font-medium text-white transition hover:bg-white/20 hover:text-white focus-visible:ring-white sm:w-auto"
              >
                <a href={`https://wa.me/${appConfig.whatsappNumber}`} target="_blank" rel="noreferrer">
                  <WhatsAppGlyph className="h-4 w-4 text-accent-contrast" />
                  <span dir="auto">{secondaryCta}</span>
                </a>
              </Button>
            ) : null}
          </div>

          {/* Proof row. */}
          <div className="flex items-center justify-center gap-8 border-t border-accent/80 pt-6 text-xs text-accent-tint lg:justify-start">
            {metrics.map((metric, index) => (
              <div key={metric.label} className="flex items-center gap-8">
                {index > 0 ? <span aria-hidden className="h-8 w-px bg-accent" /> : null}
                <div className="text-center lg:text-start">
                  <span className="block text-xl font-bold text-white">{metric.value}</span>
                  <span dir="auto">{metric.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — the paper mockup: a stack of pages, the front sheet
                   showing the first page of an eight-page lease. */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[430px]">
            {/* The rest of the contract peeking out from under the front
                       sheet — two pages, rotated and offset like a real stack. */}
            <div
              aria-hidden
              className="paper-sheet absolute inset-0 origin-bottom translate-x-10 translate-y-8 rotate-[4.5deg] rounded-xl border border-line-strong"
            />
            <div
              aria-hidden
              className="paper-sheet absolute inset-0 origin-bottom -translate-x-7 translate-y-11 -rotate-[3deg] rounded-xl border border-line-strong"
            />

            <div className="paper-sheet relative z-10 rounded-xl border border-line-strong p-6 text-navy transition-transform duration-500 hover:rotate-0 sm:p-7">
              <WathiqaMark className="watermark-seal" />

              {/* Wathiqa mark — never a heading of a State document. */}
              <header className="mb-4 border-b border-line-strong pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <WathiqaMark className="h-6 w-6" />
                    <span className="text-sm font-bold tracking-wide text-navy">
                      {appConfig.brand.name}
                    </span>
                  </span>
                  <span
                    className="rounded bg-accent-tint px-1.5 py-0.5 font-mono text-[11px] font-bold text-navy-deep"
                    dir="auto"
                  >
                    {document.badge}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[11px] uppercase text-ink-soft" dir="auto">
                  {document.ref}
                </p>
                <h2 className="mt-1 font-serif text-base font-bold text-navy" dir="auto">
                  {document.title}
                </h2>
                <p className="font-mono text-[11px] text-ink-soft" dir="auto">
                  {document.law}
                </p>
              </header>

              <div className="space-y-3 font-serif text-[12px] leading-relaxed text-ink-deep">
                <p className="font-bold" dir="auto">
                  {document.partiesLabel}
                </p>
                <div className="space-y-1 rounded border border-hairline bg-canvas p-2.5 font-sans text-[12px]">
                  <p dir="auto">{document.party1}</p>
                  <p dir="auto">{document.party2}</p>
                </div>

                {document.articles.map((article) => (
                  <div key={article.title}>
                    <p className="font-serif text-[12px] font-bold text-navy" dir="auto">
                      {article.title}
                    </p>
                    <p className="text-[12px] text-ink-soft" dir="auto">
                      {article.body}
                    </p>
                  </div>
                ))}

                {/* Summary of the whole contract, then the rest of the page
                        fades out under the stack. */}
                <div className="rounded border border-hairline bg-canvas p-2.5 font-sans">
                  <p className="font-mono text-[11px] font-bold uppercase text-navy" dir="auto">
                    {document.sommaireLabel}
                  </p>
                  <ol className="mt-1 grid grid-cols-1 gap-0.5 text-[11px] text-ink-soft sm:grid-cols-2">
                    {document.sommaireItems.map((item) => (
                      <li key={item} className="truncate" dir="auto">
                        · {item}
                      </li>
                    ))}
                  </ol>
                </div>
                {/* The page continues below the fold — suggested by skeleton
                        lines that fade under the gradient. */}
                <div aria-hidden className="space-y-2 pt-1">
                  <div className="h-2.5 w-full rounded bg-ink-faint/40" />
                  <div className="h-2.5 w-11/12 rounded bg-ink-faint/40" />
                  <div className="h-2.5 w-full rounded bg-ink-faint/40" />
                  <div className="h-2.5 w-4/5 rounded bg-ink-faint/40" />
                </div>
              </div>

              {/* The sheet continues behind the stack — fade it to the paper. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 rounded-xl bg-gradient-to-b from-transparent via-white/85 to-white"
              />

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-line-strong pt-2 font-mono text-[11px] text-ink-faint">
                <span dir="auto">{document.timestamp}</span>
                <span className="shrink-0 tabular-nums" dir="auto">
                  {document.pages}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** WhatsApp glyph — lucide ships no brand icons; everything else is lucide. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" />
    </svg>
  );
}
