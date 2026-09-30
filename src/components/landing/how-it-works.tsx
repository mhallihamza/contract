/**
 * "Comment ça marche" (§12).
 *
 * Four steps written as an editorial list rather than a feature grid: an
 * oversized thin figure (01–04), a navy title and one sentence each, threaded by
 * a single hairline on desktop. No icons here on purpose — the numbers carry the
 * sequence, the line carries the continuity.
 */
export function HowItWorks({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:py-20" data-landing-section="how">
      <div className="mx-auto w-full max-w-6xl space-y-12">
        <header className="max-w-2xl space-y-2">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
            {subtitle}
          </p>
        </header>

        <ol className="relative grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Connecting line — decorative, hidden while the steps stack. */}
          <span aria-hidden className="absolute inset-x-0 top-[2.6rem] hidden h-px bg-hairline lg:block" />

          {steps.map((step, index) => (
            <li key={step.title} className="relative space-y-3">
              <span
                aria-hidden
                className="block bg-canvas pe-4 font-serif text-[3.25rem] font-extralight leading-none tracking-tight text-navy/25 tabular-nums lg:inline-block"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-navy">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
