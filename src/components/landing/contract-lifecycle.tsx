import { CheckCircle2, FileText, History, PenLine, Search } from "lucide-react";

/** Icons of the five stages, in dictionary order (§17). */
const STAGE_ICONS = [FileText, Search, CheckCircle2, PenLine, History];

/**
 * Contract lifecycle (§17) — the journey diagram.
 *
 * Five stages, each with a number, an icon, a title and one sentence, joined
 * by a thin line that travels across the section: horizontally on large
 * screens, a vertical timeline on smaller ones — the page never forces a
 * horizontal overflow.
 */
export function ContractLifecycle({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <section id="lifecycle" data-landing-section="lifecycle" className="bg-canvas py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
        </header>

        <ol className="relative grid gap-8 before:absolute before:inset-y-2 before:start-[18px] before:w-px before:bg-hairline before:content-[''] after:absolute after:inset-x-0 after:top-[18px] after:hidden after:h-px after:bg-hairline after:content-[''] lg:grid-cols-5 lg:gap-6 lg:before:hidden lg:after:block">
          {steps.map((step) => {
            const Icon = STAGE_ICONS[0];
            const index = Number(step.n) - 1;
            const StageIcon = STAGE_ICONS[index] ?? Icon;
            return (
              <li key={step.n} className="relative flex gap-4 lg:block">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-white text-accent lg:mb-4">
                  <StageIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold tabular-nums tracking-[0.12em] text-accent">
                    {step.n}
                  </p>
                  <h3
                    className="mt-1.5 text-[15px] font-semibold uppercase tracking-[0.12em] text-navy"
                    dir="auto"
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted" dir="auto">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
