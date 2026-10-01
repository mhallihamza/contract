import { ArrowRight } from "lucide-react";

/**
 * Contract lifecycle (§14) — the big differentiator.
 *
 * Five stages, horizontally on desktop with thin arrows between them,
 * vertically on mobile: the page states that the product follows a contract
 * beyond its redaction — prepare, verify, approve, sign, follow.
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

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, index) => (
            <li key={step.n} className="relative border-t border-hairline pt-5">
              <p className="text-[13px] font-semibold tabular-nums tracking-[0.12em] text-accent">
                {step.n}
              </p>
              <h3
                className="mt-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-navy"
                dir="auto"
              >
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted" dir="auto">
                {step.body}
              </p>
              {index < steps.length - 1 ? (
                <ArrowRight
                  className="absolute -end-[22px] top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-muted lg:block rtl:rotate-180"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
