/**
 * Frequently asked questions (§62).
 *
 * Native <details> keeps the section a server component: no client JavaScript is
 * shipped for content that is pure disclosure.
 */
export function Faq({
  title,
  items,
}: {
  title: string;
  items: readonly { q: string; a: string }[];
}) {
  return (
    <section id="faq" className="border-t border-border/60 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-border bg-card px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium">
                <span dir="auto">{item.q}</span>
                <span
                  aria-hidden
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground" dir="auto">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
