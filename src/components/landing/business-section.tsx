/**
 * For companies (§21) — dashboard preview.
 *
 * Four metrics on top, then the "Activité récente" timeline. Explicitly
 * labelled as a demonstration with fictive data: nothing here claims real
 * figures about real customers.
 */
export function BusinessSection({
  title,
  subtitle,
  business,
}: {
  title: string;
  subtitle: string;
  business: {
    previewNote: string;
    stats: readonly { label: string; value: string }[];
    activityLabel: string;
    activity: readonly string[];
  };
}) {
  return (
    <section id="business" data-landing-section="business" className="bg-canvas py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
        </header>

        <div className="overflow-hidden rounded-[14px] border border-hairline bg-white shadow-[0_10px_30px_rgba(16,33,63,0.06)]">
          <div className="border-b border-hairline bg-canvas px-5 py-3">
            <p className="text-[11px] text-ink-muted" dir="auto">
              {business.previewNote}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {business.stats.map((stat) => (
                <div key={stat.label} className="rounded-[10px] border border-hairline bg-canvas p-4">
                  <dt className="text-[12px] font-medium text-ink-muted" dir="auto">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-navy">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-hairline pt-5">
              <h3 className="text-lg font-semibold text-navy" dir="auto">
                {business.activityLabel}
              </h3>
              <ol className="relative mt-4 space-y-4 before:absolute before:bottom-1 before:start-[3px] before:top-1 before:w-px before:bg-hairline before:content-['']">
                {business.activity.map((entry, index) => (
                  <li key={entry} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        index === business.activity.length - 1 ? "bg-gold" : "bg-accent"
                      }`}
                    />
                    <span className="text-[14px] text-navy" dir="auto">
                      {entry}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
