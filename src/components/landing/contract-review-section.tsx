import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

/** Width rhythm of the placeholder lines of the document preview (§16). */
const LINE_WIDTHS = ["100%", "94%", "97%", "82%", "91%", "70%"];

/**
 * Contract review (§16) — dark navy band.
 *
 * Header: headline, subheadline, one honest sentence. Then a single large
 * review interface — on the left the document preview (filename, page count,
 * page surface), on the right the "POINTS À VÉRIFIER" checklist with
 * restrained success/attention colours. The caption states plainly that this
 * is a preview and that no legal analysis is displayed.
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
    pointsLabel: string;
    note: string;
    rows: readonly { label: string; state: string }[];
  };
}) {
  return (
    <section id="review" data-landing-section="review" className="bg-navy-deep py-24 text-white lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-white sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p
            className="border-s-2 border-gold ps-4 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-[1.75rem] lg:text-[2rem]"
            dir="auto"
          >
            {statement}
          </p>
          <p className="text-[17px] leading-relaxed text-white/70 lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        {/* Review interface: document preview on the left, checklist on the right. */}
        <div className="overflow-hidden rounded-[14px] border border-white/10 bg-white text-navy shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-white px-5 py-3.5">
            <p className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-navy" dir="ltr">
              <FileText className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
              <span className="truncate">{review.fileName}</span>
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              <span className="whitespace-nowrap text-[12px] text-ink-muted" dir="auto">
                {review.pages}
              </span>
            </p>
            <div className="flex items-center gap-2.5">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                dir="auto"
              >
                {review.statusLabel}
              </span>
              <span
                className="rounded-full bg-warning/10 px-3 py-1 text-[12px] font-semibold text-warning"
                dir="auto"
              >
                {review.status}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {/* LEFT — document preview surface. */}
            <div className="bg-canvas p-5 sm:p-6">
              <div className="mx-auto max-w-[20rem] rounded-[6px] border border-hairline bg-white p-5 shadow-[0_1px_3px_rgba(16,33,63,0.06)]">
                <p className="break-all text-center text-[13px] font-semibold text-navy" dir="ltr">
                  {review.fileName.replace(/\.[^.]+$/, "")}
                </p>
                <div className="mt-4 space-y-2.5">
                  {LINE_WIDTHS.map((width) => (
                    <span
                      key={width}
                      aria-hidden
                      className="block h-1.5 rounded-full bg-hairline"
                      style={{ width }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
                  <span aria-hidden className="block h-1.5 w-3/4 rounded-full bg-hairline" />
                  <span aria-hidden className="block h-1.5 w-3/4 justify-self-end rounded-full bg-hairline" />
                </div>
              </div>
            </div>

            {/* RIGHT — points to check. */}
            <div className="border-t border-hairline bg-white p-5 sm:p-6 md:border-s md:border-t-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
                dir="auto"
              >
                {review.pointsLabel}
              </p>
              <ul className="mt-4 space-y-3">
                {review.rows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-[14px] text-navy" dir="auto">
                      {row.label}
                    </span>
                    {row.state === "ok" ? (
                      <CheckCircle2
                        className="h-[18px] w-[18px] shrink-0 text-success"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : (
                      <AlertCircle
                        className="h-[18px] w-[18px] shrink-0 text-warning"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/50" dir="auto">
          {review.note}
        </p>
      </div>
    </section>
  );
}
