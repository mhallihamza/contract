import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Status pill of a preview row — tone comes from the dictionary row data.
 *  Only the palette colours: accent (#1E3A6E), its soft tint (#EEF2FA) and the
 *  neutral greys — statuses are told apart by fill, border and weight. */
const TONE_CLASS: Record<string, string> = {
  review: "bg-accent-soft text-accent",
  ready: "border border-accent/40 bg-accent-soft text-accent",
  done: "bg-accent text-white",
  draft: "bg-canvas-tint text-ink-muted",
};

/**
 * "Pour les entreprises" (§16).
 *
 * A dashboard preview — four counters and the recent-documents list a company
 * actually works from. Every row is illustrative: the panel carries an explicit
 * "démonstration" note, so the marketing page never implies real activity.
 */
export function BusinessSection({
  title,
  subtitle,
  cta,
  business,
}: {
  title: string;
  subtitle: string;
  cta: string;
  business: {
    previewNote: string;
    dashboardTitle: string;
    stats: readonly { label: string; value: string }[];
    tableTitle: string;
    columns: { document: string; client: string; status: string; date: string };
    rows: readonly { document: string; client: string; status: string; date: string; tone: string }[];
  };
}) {
  return (
    <section id="business" className="px-4 py-16 sm:px-6 lg:py-20" data-landing-section="business">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
              {subtitle}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 rounded-[12px] border-hairline bg-white px-5 text-accent hover:bg-canvas-tint focus-visible:ring-accent"
          >
            <Link href="/contracts">
              {cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </header>

        <div className="overflow-hidden rounded-[20px] border border-hairline bg-white shadow-[0_30px_60px_-45px_rgba(16,27,53,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-canvas-tint px-6 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">
              <span aria-hidden className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-navy/20" />
                <span className="h-2 w-2 rounded-full bg-navy/20" />
                <span className="h-2 w-2 rounded-full bg-navy/20" />
              </span>
              {business.dashboardTitle}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted" dir="auto">
              {business.previewNote}
            </p>
          </div>

          <div className="grid gap-4 border-b border-hairline p-6 sm:grid-cols-2 lg:grid-cols-4">
            {business.stats.map((stat) => (
              <div key={stat.label} className="space-y-1 rounded-[14px] bg-canvas px-4 py-3">
                <p className="font-serif text-2xl font-semibold text-navy tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs leading-snug text-ink-muted" dir="auto">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-6">
            <h3 className="text-sm font-semibold text-navy" dir="auto">
              {business.tableTitle}
            </h3>

            <div
              className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted sm:grid sm:grid-cols-[1.6fr_1.2fr_auto_auto] sm:gap-4"
              dir="auto"
            >
              <span>{business.columns.document}</span>
              <span>{business.columns.client}</span>
              <span>{business.columns.status}</span>
              <span>{business.columns.date}</span>
            </div>

            <ul className="divide-y divide-hairline">
              {business.rows.map((row) => (
                <li
                  key={row.document}
                  className="flex flex-col gap-2 py-3.5 sm:grid sm:grid-cols-[1.6fr_1.2fr_auto_auto] sm:items-center sm:gap-4"
                >
                  <p className="text-sm font-medium text-navy" dir="auto">
                    {row.document}
                  </p>
                  <p className="text-xs text-ink-muted sm:text-sm" dir="auto">
                    {row.client}
                  </p>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[row.tone] ?? TONE_CLASS.draft}`}
                    dir="auto"
                  >
                    {row.status}
                  </span>
                  <p className="text-xs text-ink-muted tabular-nums" dir="auto">
                    {row.date}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
