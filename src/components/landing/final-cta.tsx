import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Closing call to action (§17).
 *
 * The only deep-navy band above the footer: one serif headline, one sentence,
 * two buttons. It repeats no argument — it simply gives the visitor who read the
 * whole page the same two doors as the hero.
 */
export function FinalCta({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  primaryHref = "/contracts",
  secondaryHref = "/assistant",
}: {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-navy-deep px-4 py-16 sm:px-6 lg:py-20" data-landing-section="final-cta">
      <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
        <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-white sm:text-[2.5rem]">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base" dir="auto">
          {subtitle}
        </p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-[12px] bg-accent px-6 text-white hover:bg-accent/90 focus-visible:ring-accent"
          >
            <Link href={primaryHref}>
              {primaryCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-[12px] border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/60"
          >
            <Link href={secondaryHref}>{secondaryCta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
