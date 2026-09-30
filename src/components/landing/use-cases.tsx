import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowRight, Briefcase, Building2, Car, FileUser, Handshake, ShieldCheck } from "lucide-react";
import { USE_CASES } from "@/lib/marketing/mock-data";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** One icon per family — thin strokes, single accent colour, no illustration. */
const ICONS: Record<string, IconComponent> = {
  building: Building2,
  handshake: Handshake,
  briefcase: Briefcase,
  car: Car,
  fileUser: FileUser,
  shield: ShieldCheck,
};

/**
 * "Ce que vous venez régler" (§9–§11).
 *
 * Six editorial cards — no photography: each card opens on a fixed 120px icon
 * zone (#EEF2FA, one 32px accent icon), then the family name, one explanatory
 * sentence and a discreet arrow. Six cards fill the 3 × 2 desktop grid without
 * a hole. Cards lift by 4px on hover — decorative, so declared `motion-safe`
 * and gone when the visitor asks for reduced motion (§22).
 */
export function UseCases({
  title,
  subtitle,
  note,
  cta,
  labels,
}: {
  title: string;
  subtitle: string;
  note: string;
  cta: string;
  /** Copy per use case id, in the dictionary language. */
  labels: Record<string, { title: string; body: string }>;
}) {
  return (
    <section
      id="solutions"
      className="border-y border-hairline bg-canvas px-4 py-16 sm:px-6 lg:py-20"
      data-landing-section="solutions"
    >
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
              {subtitle}
            </p>
          </div>
          <Link
            href="/contracts"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition-all hover:gap-2.5"
          >
            {cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </header>

        <ul className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((useCase) => {
            const Icon = ICONS[useCase.icon] ?? ShieldCheck;
            const copy = labels[useCase.id];
            if (!copy) return null;
            return (
              <li key={useCase.id} className="h-full">
                <Link
                  href={useCase.href}
                  className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-hairline bg-white motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-300 hover:border-navy/20 hover:shadow-[0_24px_48px_-30px_rgba(15,23,41,0.35)] motion-safe:hover:-translate-y-1"
                >
                  {/* Icon zone of the card — fixed 120px, light accent background,
                      one 32px accent icon, top corners rounded by the card itself. */}
                  <div className="flex h-[120px] w-full items-center justify-center bg-accent-soft">
                    <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} aria-hidden />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-6">
                    <h3 className="font-serif text-lg font-semibold text-navy">{copy.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
                      {copy.body}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-accent motion-safe:transition-all motion-safe:group-hover:gap-2.5">
                      {cta}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-xs leading-relaxed text-ink-muted" dir="auto">
          {note}
        </p>
      </div>
    </section>
  );
}
