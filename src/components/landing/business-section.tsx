import { appConfig } from "@/lib/config";

/** Status chip tone per row state (§18). */
const TONE_CLASS: Record<string, string> = {
  review: "bg-warning/10 text-warning",
  active: "bg-success-soft text-success",
  pending: "bg-accent-soft text-accent",
};

/**
 * For companies (§18) — dashboard preview.
 *
 * A realistic product surface: sidebar, overview cards, contract table — all
 * explicitly labelled as a demonstration with fictive data. The table scrolls
 * horizontally inside its own frame on small screens so the page never
 * overflows.
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
    sidebar: readonly string[];
    mainTitle: string;
    stats: readonly { label: string; value: string }[];
    columns: readonly string[];
    rows: readonly { name: string; type: string; status: string; date: string; tone: string }[];
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

          <div className="flex">
            <nav
              className="hidden w-44 shrink-0 border-e border-hairline bg-canvas p-4 md:block"
              aria-label={appConfig.brand.name}
            >
              <ul className="space-y-1">
                {business.sidebar.map((entry, index) => (
                  <li key={entry}>
                    <span
                      className={
                        index === 0
                          ? "block rounded-[8px] bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent"
                          : "block rounded-[8px] px-3 py-2 text-[13px] text-ink-muted"
                      }
                      dir="auto"
                    >
                      {entry}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 flex-1 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-navy" dir="auto">
                {business.mainTitle}
              </h3>

              <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse">
                  <thead>
                    <tr className="border-b border-hairline">
                      {business.columns.map((column, index) => (
                        <th
                          key={column}
                          className={
                            index === business.columns.length - 1
                              ? "py-2.5 text-end text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
                              : "py-2.5 text-start text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
                          }
                          scope="col"
                          dir="auto"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {business.rows.map((row) => (
                      <tr key={row.name} className="border-b border-hairline last:border-b-0">
                        <td className="py-3 pe-4 text-[14px] font-medium text-navy" dir="auto">
                          {row.name}
                        </td>
                        <td className="py-3 pe-4 text-[14px] text-ink-muted" dir="auto">
                          {row.type}
                        </td>
                        <td className="py-3 pe-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE_CLASS[row.tone] ?? "bg-accent-soft text-accent"}`}
                            dir="auto"
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-end text-[14px] tabular-nums text-ink-muted" dir="ltr">
                          {row.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
