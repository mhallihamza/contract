import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_PHOTO } from "@/lib/marketing/mock-data";

/** Shape of the floating "VOTRE DEMANDE" panel (§9). */
export interface HeroPanel {
  label: string;
  subject: string;
  stage: string;
  steps: readonly { label: string; done: boolean }[];
  note: string;
}

/**
 * Hero of the homepage (§8–§9).
 *
 * Editorial two-column split: the promise on the left, on the right a single
 * professional photograph with the request panel floating over it — the visitor
 * sees a real product surface, not a stock dashboard. Copy is dictionary-driven
 * so the Arabic page states the same promise.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  reassurance,
  photoAlt,
  panel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  reassurance: string;
  photoAlt: string;
  panel: HeroPanel;
}) {
  return (
    <section data-landing-section="hero" className="bg-canvas">
      <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[47fr_53fr] lg:gap-16 lg:py-24">
        {/* Left — the promise. */}
        <div className="space-y-6">
          <p className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden className="h-px w-7 bg-gold" />
            <span dir="auto">{eyebrow}</span>
          </p>

          <h1 className="text-[2.625rem] font-semibold leading-[1.02] tracking-[-0.02em] text-navy sm:text-[3.25rem] lg:text-[4rem]">
            {title}
          </h1>

          <p className="max-w-xl text-lg leading-[1.6] text-ink-muted xl:text-xl" dir="auto">
            {subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[12px] bg-accent px-7 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(16,33,63,0.12)] transition hover:-translate-y-0.5 hover:bg-navy-mid focus-visible:ring-accent"
            >
              <Link href="/assistant">
                {primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[12px] border-hairline bg-white px-7 text-[15px] font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-canvas focus-visible:ring-accent"
            >
              <Link href="/#services">{secondaryCta}</Link>
            </Button>
          </div>

          <p className="text-sm text-ink-muted" dir="auto">
            {reassurance}
          </p>
        </div>

        {/* Right — one photograph, one floating product surface. */}
        <div className="relative">
          <div className="overflow-hidden rounded-[14px] border border-hairline bg-accent-soft shadow-[0_10px_30px_rgba(16,33,63,0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local asset with intrinsic
                dimensions, no image-optimizer dependency: the deployment must build and run offline. */}
            <img
              src={HERO_PHOTO}
              alt={photoAlt}
              width={1400}
              height={2100}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-[20rem] w-full object-cover object-[50%_30%] sm:h-[24rem] lg:h-[30rem]"
            />
          </div>

          <div className="relative z-10 mx-4 -mt-12 rounded-[14px] border border-hairline bg-white p-5 shadow-[0_10px_30px_rgba(16,33,63,0.12)] sm:mx-10 lg:absolute lg:-bottom-8 lg:-start-6 lg:mx-0 lg:mt-0 lg:w-[19rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
              {panel.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-navy" dir="auto">
              {panel.subject}
            </p>
            <p className="text-[13px] text-ink-muted" dir="auto">
              {panel.stage}
            </p>
            <ul className="mt-4 space-y-2.5 border-t border-hairline pt-4">
              {panel.steps.map((step) => (
                <li key={step.label} className="flex items-center gap-2.5 text-[13px]">
                  {step.done ? (
                    <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2.25} aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-ink-muted/50" strokeWidth={1.75} aria-hidden />
                  )}
                  <span className={step.done ? "text-navy" : "text-ink-muted"} dir="auto">
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-hairline pt-3 text-[11px] text-ink-muted" dir="auto">
              {panel.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
