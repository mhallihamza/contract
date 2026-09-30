import Link from "next/link";
import { ArrowRight, Check, FileCheck, Timer, UserRound } from "lucide-react";
import { TrustBadge } from "@/components/landing/trust-badge";
import { Button } from "@/components/ui/button";
import { HERO_PHOTO } from "@/lib/marketing/mock-data";

/** Icons of the three micro-trust items, in dictionary order. */
const TRUST_ICONS = [FileCheck, Timer, UserRound];

/**
 * Hero of the homepage (§7–§8).
 *
 * Editorial split — 48% argument, 52% photography — on a neutral canvas.
 * The copy answers the only question a first-time visitor has ("what do I get,
 * and who checks it?"), and the reassurance line states the promise in one
 * breath: built on verified templates, validated by a lawyer when required.
 */
export function HomeHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  reassurance,
  trustItems,
  primaryHref = "/contracts",
  secondaryHref = "/assistant",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  reassurance: string;
  trustItems: readonly { title: string; body: string }[];
  primaryHref?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-canvas-tint" data-landing-section="hero">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[48fr_52fr] lg:gap-14 lg:py-20">
        <div className="space-y-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            {eyebrow}
          </p>

          <h1 className="font-serif text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            {title}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-ink-muted" dir="auto">
            {subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[12px] bg-accent px-6 text-white shadow-sm hover:bg-navy focus-visible:ring-accent"
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
              className="h-12 rounded-[12px] border-hairline bg-white px-6 text-accent hover:bg-canvas-tint focus-visible:ring-accent"
            >
              <Link href={secondaryHref}>{secondaryCta}</Link>
            </Button>
          </div>

          <p className="flex items-start gap-2 text-xs font-medium text-accent">
            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span dir="auto">{reassurance}</span>
          </p>

          <ul className="grid gap-5 border-t border-hairline pt-7 sm:grid-cols-3">
            {trustItems.map((item, index) => {
              const Icon = TRUST_ICONS[index] ?? FileCheck;
              return (
                <li key={item.title}>
                  <TrustBadge
                    icon={<Icon className="h-4 w-4" strokeWidth={1.6} />}
                    title={item.title}
                    body={item.body}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Editorial photograph — 24px radius, cropped to the column at every width. */}
        <div className="overflow-hidden rounded-[24px] bg-accent-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local asset with intrinsic dimensions,
              no image-optimizer dependency: the deployment must build and run offline. */}
          <img
            src={HERO_PHOTO}
            alt=""
            width={1400}
            height={2100}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-[22rem] w-full object-cover sm:h-[26rem] lg:h-[34rem]"
          />
        </div>
      </div>
    </section>
  );
}
