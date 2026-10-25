import { Check, Zap } from "lucide-react";

/** Copy shape of `d.public.home.comparison` — FR reference, AR mirror. */
export interface ComparisonRow {
  criterion: string;
  bad: string;
  good: string;
  /** Which icon carries the gain: "bolt" (speed/convenience) or check. */
  kind: string;
}

/**
 * The comparison (§10) — the honest table a visitor makes before committing.
 *
 * Two columns only: the traditional office (or draftsman) against Wathiqa.
 * Rows carry the criteria that actually decide a legal-services purchase —
 * travel, delay, price transparency, choice of validation level. The Wathiqa
 * column wears the emerald header; the icons mark the nature of the gain
 * (convenience or speed). No superlatives — the two cells state facts.
 */
export function ComparisonSection({
  eyebrow,
  title,
  columns,
  rows,
}: {
  eyebrow: string;
  title: string;
  columns: { criteria: string; them: string; us: string };
  rows: readonly ComparisonRow[];
}) {
  return (
    <section
      id="comparison"
      data-landing-section="comparison"
      className="border-b border-hairline bg-white py-20"
    >
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
            {eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-4xl" dir="auto">
            {title}
          </h2>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-hairline">
          {/* Header row — the three column titles. */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-hairline bg-canvas text-sm font-semibold">
            <div className="px-5 py-4 text-ink-muted" dir="auto">
              {columns.criteria}
            </div>
            <div className="border-s border-hairline px-5 py-4 text-ink-muted" dir="auto">
              {columns.them}
            </div>
            <div className="border-s border-hairline bg-navy-deep px-5 py-4 text-white" dir="auto">
              {columns.us}
            </div>
          </div>

          {rows.map((row) => (
            <div
              key={row.criterion}
              className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-hairline last:border-b-0"
            >
              <div className="px-5 py-4 text-sm font-medium text-navy" dir="auto">
                {row.criterion}
              </div>
              <div className="border-s border-hairline px-5 py-4 text-sm text-ink-muted" dir="auto">
                {row.bad}
              </div>
              <div className="flex items-start gap-2 border-s border-hairline bg-accent-soft px-5 py-4 text-sm font-medium text-navy" dir="auto">
                {row.kind === "bolt" ? (
                  <Zap aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brass-text" />
                ) : (
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                )}
                <span>{row.good}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
