/**
 * Frequently asked questions (§62).
 *
 * Native <details> keeps the section a server component: no client JavaScript is
 * shipped for content that is pure disclosure. Kept on the homepage as a
 * trust-building block: the answers state plainly what the platform does not do
 * (no blanket validity claim, no substitute for a lawyer's review).
 */
export function Faq({
  title,
  items,
}: {
  title: string;
  items: readonly { q: string; a: string }[];
}) {
  return (
    <section id="faq" className="border-t border-hairline px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-navy sm:text-[2rem]">
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-hairline bg-white px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-navy">
                <span dir="auto">{item.q}</span>
                <span
                  aria-hidden
                  className="text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted" dir="auto">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
