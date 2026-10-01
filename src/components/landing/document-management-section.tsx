/**
 * Document management (§19) — product preview.
 *
 * A realistic product surface built from live components: sidebar, section
 * title, filter pills and the "Mes contrats" table. Explicitly labelled as a
 * demonstration with fictive data; the table scrolls horizontally inside its
 * own frame on small screens so the page never overflows.
 */
const TONE_CLASS: Record<string, string> = {
  review: "bg-warning/10 text-warning",
  active: "bg-success-soft text-success",
  pending: "bg-accent-soft text-accent",
};

export function DocumentManagementSection({
  title,
  text,
  documents,
}: {
  title: string;
  text: string;
  documents: {
    previewNote: string;
    sidebar: readonly string[];
    title: string;
    filters: readonly string[];
    columns: readonly string[];
    rows: readonly { name: string; type: string; status: string; date: string; tone: string }[];
  };
}) {
  return (
    <section id="documents" data-landing-section="documents" className="bg-canvas py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div className="overflow-hidden rounded-[14px] border border-hairline bg-white shadow-[0_10px_30px_rgba(16,33,63,0.06)]">
          <div className="border-b border-hairline bg-canvas px-5 py-3">
            <p className="text-[11px] text-ink-muted" dir="auto">
              {documents.previewNote}
            </p>
          </div>

          <div className="flex">
            <nav
              aria-label={documents.title}
              className="hidden w-44 shrink-0 border-e border-hairline bg-canvas p-4 md:block"
            >
              <ul className="space-y-1">
                {documents.sidebar.map((entry, index) => (
                  <li key={entry}>
                    <span
                      className={
                        index === 2
                          ? "block rounded-[8px] bg-white px-3 py-2 text-[13px] font-semibold text-accent shadow-[0_1px_2px_rgba(16,33,63,0.06)]"
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-navy" dir="auto">
                  {documents.title}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {documents.filters.map((filter, index) => (
                    <li key={filter}>
                      <span
                        className={
                          index === 0
                            ? "inline-block rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white"
                            : "inline-block rounded-full border border-hairline bg-white px-3 py-1.5 text-[12px] font-medium text-ink-muted"
                        }
                        dir="auto"
                      >
                        {filter}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse">
                  <thead>
                    <tr className="border-b border-hairline">
                      {documents.columns.map((column, index) => (
                        <th
                          key={column}
                          className={
                            index === documents.columns.length - 1
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
                    {documents.rows.map((row) => (
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
