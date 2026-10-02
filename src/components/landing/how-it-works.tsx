/**
 * How it works (§14).
 *
 * Three steps, one sentence each. Horizontal on desktop, vertical on mobile —
 * a numbered editorial list, never a workflow diagram.
 */
export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: readonly { n: string; title: string }[];
}) {
  return (
    <section id="process" data-landing-section="process" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-12">
        <h2 className="max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
          {title}
        </h2>

        <ol className="grid gap-8 border-t border-hairline pt-10 lg:grid-cols-3 lg:gap-12 lg:pt-12">
          {steps.map((step) => (
            <li key={step.n} className="flex items-baseline gap-4 lg:block">
              <p className="text-[12px] font-semibold tabular-nums tracking-[0.14em] text-ink-muted lg:mb-4">
                {step.n}
              </p>
              <p
                className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-navy lg:text-[1.375rem]"
                dir="auto"
              >
                {step.title}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}