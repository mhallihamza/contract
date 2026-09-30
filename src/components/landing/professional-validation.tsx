/**
 * "Un professionnel intervient quand c'est nécessaire" (§14).
 *
 * The five stages of a case, laid out as a vertical flow threaded by a thin navy
 * line: client → preparation → professional review → approval → final document.
 * The section exists to be honest about the boundary of the product: the
 * platform prepares, a lawyer reviews when the case requires it.
 */
export function ProfessionalValidation({
  title,
  subtitle,
  stages,
}: {
  title: string;
  subtitle: string;
  stages: readonly { title: string; body: string }[];
}) {
  return (
    <section id="validation" className="px-4 py-16 sm:px-6 lg:py-20" data-landing-section="validation">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[44fr_56fr] lg:gap-16">
        <header className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
            {subtitle}
          </p>
        </header>

        <ol className="border-s border-hairline ps-10">
          {stages.map((stage, index) => (
            <li key={stage.title} className="relative pb-9 last:pb-0">
              <span
                aria-hidden
                className="absolute start-0 top-1 -ms-[0.6rem] flex h-5 w-5 items-center justify-center rounded-full border border-hairline bg-canvas"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-navy" />
              </span>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-navy" dir="auto">
                {stage.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted" dir="auto">
                {stage.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
