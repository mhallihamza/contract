import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Final call to action (§22).
 *
 * A natural conclusion on the dark band: one question, one sentence, one
 * white button, and who the service is for. No marketing explosion, no
 * countdown, no fake urgency.
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
    <section data-landing-section="final-cta" className="bg-navy-deep py-24 text-center lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-[2.25rem] font-semibold leading-tight tracking-[-0.015em] text-white sm:text-[2.75rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-white/70 lg:text-lg" dir="auto">
            {subtitle}
          </p>
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[12px] bg-white px-7 text-[15px] font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-canvas focus-visible:ring-white"
            >
              <Link href="/assistant">
                {primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-white/50" dir="auto">
            {secondaryCta}
          </p>
        </div>
      </div>
    </section>
  );
}
