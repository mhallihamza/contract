/**
 * Principles (§19).
 *
 * Large typography and whitespace only — three principles that state how the
 * service treats a request: understand, structure, keep control. No icons, no
 * cards: the page should breathe here.
 */
export function WhySection({
  title,
  principles,
}: {
  title: string;
  principles: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <section id="why" data-landing-section="why" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-12">
        <h2 className="max-w-3xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
          {title}
        </h2>

        <ol className="grid gap-10 lg:grid-cols-3 lg:gap-14">
          {principles.map((principle) => (
            <li key={principle.n} className="border-t-2 border-accent pt-6">
              <p className="text-[13px] font-semibold tabular-nums tracking-[0.14em] text-accent">
                {principle.n}
              </p>
              <h3
                className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-navy lg:text-[1.75rem]"
                dir="auto"
              >
                {principle.title}
              </h3>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-muted" dir="auto">
                {principle.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
