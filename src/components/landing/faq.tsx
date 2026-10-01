/**
 * Frequently asked questions (§21).
 *
 * Native <details> keeps the section a server component — the accordion is
 * keyboard-accessible and works without JavaScript. Layout: title on the left,
 * disclosures on the right. Answers stay concise and honest: no operational
 * promise the backend cannot keep.
 */
export function Faq({
  title,
  items,
}: {
  title: string;
  items: readonly { q: string; a: string }[];
}) {
  return (
    <section id="faq" data-landing-section="faq" className="bg-white py-24 lg:py-32">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <header>
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[2.75rem]">
            {title}
          </h2>
        </header>

        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-[12px] border border-hairline bg-white px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 rounded text-[15px] font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
                <span dir="auto">{item.q}</span>
                <span
                  aria-hidden
                  className="text-xl leading-none text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p
                className="mt-3 border-t border-hairline pt-3 text-[15px] leading-relaxed text-ink-muted"
                dir="auto"
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
