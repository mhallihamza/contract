/** One row of the comparison: the usual way, and the platform's way. */
interface ComparisonRow {
  criterion: string;
  before: string;
  after: string;
}

/**
 * Comparison (§11bis).
 *
 * The question a visitor asks just before committing: what does preparing a
 * contract here change compared to the usual way? Two columns on one hairline
 * table, four criteria, each stated qualitatively — no timing, no percentage,
 * no price and no competitor named, because none of those can be substantiated.
 * The left column stays neutral grey rather than red: this is a difference of
 * parcours, not an attack on a profession.
 *
 * Placed between the review and the validation band, so the positioning
 * argument lands immediately before the page's single dark section.
 */
export function ComparisonSection({
  eyebrow,
  title,
  text,
  comparison,
}: {
  eyebrow: string;
  title: string;
  text: string;
  comparison: {
    criteriaLabel: string;
    columns: readonly string[];
    rows: readonly ComparisonRow[];
  };
}) {
  const [usualLabel, platformLabel] = comparison.columns;

  return (
    <section
      id="comparatif"
      data-landing-section="comparison"
      className="bg-canvas py-24 lg:py-32"
    >
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-6 bg-brass" />
            <span dir="auto">{eyebrow}</span>
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div className="overflow-hidden rounded-[12px] border border-hairline bg-surface">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-hairline bg-canvas">
                <th
                  scope="col"
                  className="w-[26%] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:px-7"
                >
                  {comparison.criteriaLabel}
                </th>
                <th
                  scope="col"
                  className="px-5 py-4 text-[15px] font-medium text-ink-muted sm:px-7"
                  dir="auto"
                >
                  {usualLabel}
                </th>
                <th
                  scope="col"
                  className="px-5 py-4 text-[15px] font-semibold text-navy sm:px-7"
                  dir="auto"
                >
                  {platformLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.criterion} className="border-b border-hairline last:border-b-0">
                  <th
                    scope="row"
                    className="px-5 py-4 align-top text-[15px] font-semibold text-navy sm:px-7 sm:py-5"
                    dir="auto"
                  >
                    {row.criterion}
                  </th>
                  <td
                    className="px-5 py-4 align-top text-[15px] leading-relaxed text-ink-muted sm:px-7 sm:py-5"
                    dir="auto"
                  >
                    {row.before}
                  </td>
                  <td
                    className="px-5 py-4 align-top text-[15px] leading-relaxed text-navy sm:px-7 sm:py-5"
                    dir="auto"
                  >
                    {row.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}