/**
 * How it works (§15).
 *
 * Four steps, one headline: "Simple pour vous. Structuré derrière." The third
 * step keeps the careful promise — a professional validation *may* intervene
 * when the situation requires it, never that every document is reviewed.
 */
export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <section id="how-it-works" data-landing-section="how-it-works" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
        </header>

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} className="border-t border-hairline pt-6">
              <p className="text-[2.75rem] font-light leading-none tabular-nums text-navy/20">
                {step.n}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-navy lg:text-xl" dir="auto">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted" dir="auto">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
