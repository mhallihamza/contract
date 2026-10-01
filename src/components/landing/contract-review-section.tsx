import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

/**
 * Contract review (§13).
 *
 * The strongest section: on the left the sobering statement, on the right a
 * realistic review surface — a dropped file, its status, and the six clauses
 * a reader should look at before signing. Status indicators are neutral shapes
 * (check / alert), and the caption states plainly that this is a preview with
 * no legal analysis on display.
 */
export function ContractReviewSection({
  title,
  statement,
  text,
  review,
}: {
  title: string;
  statement: string;
  text: string;
  review: {
    docLabel: string;
    fileName: string;
    pages: string;
    statusLabel: string;
    status: string;
    note: string;
    rows: readonly { label: string; state: string }[];
  };
}) {
  return (
    <section id="review" data-landing-section="review" className="bg-white py-24 lg:py-32">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <header className="space-y-5">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p
            className="text-[1.5rem] font-semibold leading-snug tracking-[-0.01em] text-accent sm:text-[1.875rem] lg:text-[2.25rem]"
            dir="auto"
          >
            {statement}
          </p>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div>
          <div className="rounded-[14px] border border-hairline bg-white shadow-[0_10px_30px_rgba(16,33,63,0.06)]">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft">
                  <FileText className="h-5 w-5 text-accent" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    {review.docLabel}
                  </p>
                  <p className="mt-1 break-all text-[15px] font-medium text-navy" dir="ltr">
                    {review.fileName}
                  </p>
                  <p className="text-[13px] text-ink-muted" dir="auto">
                    {review.pages}
                  </p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  {review.statusLabel}
                </p>
                <span
                  className="mt-1.5 inline-block rounded-full bg-warning/10 px-3 py-1 text-[12px] font-semibold text-warning"
                  dir="auto"
                >
                  {review.status}
                </span>
              </div>
            </div>

            <ul className="border-t border-hairline">
              {review.rows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3 last:border-b-0 sm:px-6"
                >
                  <span className="text-[14px] text-navy" dir="auto">
                    {row.label}
                  </span>
                  {row.state === "ok" ? (
                    <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-success" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <AlertCircle className="h-[18px] w-[18px] shrink-0 text-warning" strokeWidth={1.75} aria-hidden />
                  )}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-ink-muted" dir="auto">
            {review.note}
          </p>
        </div>
      </div>
    </section>
  );
}
