import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Final call to action (§25) — large ivory area.
 *
 * One question, one sentence, one dark navy button, and who the service is
 * for. Behind the copy, an extremely subtle outline of stacked documents —
 * geometry, no photography. No countdown, no fake urgency.
 */
export function FinalCta({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}) {
  return (
    <section data-landing-section="final-cta" className="relative overflow-hidden bg-canvas py-24 text-center lg:py-28">
      {/* Subtle document outline behind the copy (decorative only). */}
      <svg
        aria-hidden
        viewBox="0 0 560 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[20rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-hairline opacity-70 sm:h-[24rem] sm:w-[34rem]"
      >
        <rect x="120" y="36" width="230" height="316" rx="10" opacity="0.55" />
        <rect x="208" y="60" width="230" height="316" rx="10" />
        <line x1="238" y1="112" x2="366" y2="112" />
        <line x1="238" y1="146" x2="408" y2="146" opacity="0.7" />
        <line x1="238" y1="180" x2="392" y2="180" opacity="0.7" />
        <line x1="238" y1="214" x2="352" y2="214" opacity="0.7" />
        <line x1="238" y1="248" x2="404" y2="248" opacity="0.7" />
        <line x1="238" y1="318" x2="306" y2="318" />
        <line x1="334" y1="318" x2="404" y2="318" />
      </svg>

      <div className="container-page relative">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-[2.25rem] font-semibold leading-tight tracking-[-0.015em] text-navy sm:text-[2.75rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-lg" dir="auto">
            {subtitle}
          </p>
          <div className="pt-2">
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
          </div>
          <p className="text-sm text-ink-muted" dir="auto">
            {secondaryCta}
          </p>
        </div>
      </div>
    </section>
  );
}
