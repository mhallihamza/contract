import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Final call to action (§16).
 *
 * A question, one sentence, one dark button. No image, no illustration, no
 * decorative shape, no countdown, no fake urgency.
 */
export function FinalCta({
  title,
  subtitle,
  primaryCta,
}: {
  title: string;
  subtitle: string;
  primaryCta: string;
}) {
  return (
    <section data-landing-section="final-cta" className="bg-white py-24 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
          <div className="pt-1">
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
          </div>
        </div>
      </div>
    </section>
  );
}