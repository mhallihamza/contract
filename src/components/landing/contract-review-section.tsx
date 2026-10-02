import { FileText } from "lucide-react";

/**
 * Contract review (§11).
 *
 * Headline and one sentence on the left; on the right a single document
 * preview — filename, page count, a plain page surface — then the short list
 * of points a review looks at, each with a neutral indicator. No scanning
 * interface, no red warnings, no claim of automatic legal analysis: the
 * caption says exactly what this is.
 */
export function ContractReviewSection({
  title,
  text,
  review,
}: {
  title: string;
  text: string;
  review: {
    fileName: string;
    pages: string;
    pointsLabel: string;
    points: readonly string[];
    note: string;
  };
}) {
  return (
    <section id="review" data-landing-section="review" className="bg-white py-24 lg:py-32">
      <div className="container-page grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <header className="space-y-5 lg:pt-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div className="space-y-8">
          {/* The document being reviewed. */}
          <div className="overflow-hidden rounded-[12px] border border-hairline bg-surface shadow-[0_1px_2px_rgba(23,43,58,0.04),0_14px_34px_rgba(23,43,58,0.06)]">
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-hairline">
                <FileText className="h-4 w-4 text-navy-deep" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-navy" dir="ltr">
                {review.fileName}
              </p>
              <span className="shrink-0 text-[12px] text-ink-muted" dir="auto">
                {review.pages}
              </span>
            </div>

            <div className="space-y-2.5 px-5 py-6">
              <span aria-hidden className="block h-[3px] w-full rounded-full bg-hairline" />
              <span aria-hidden className="block h-[3px] w-[92%] rounded-full bg-hairline" />
              <span aria-hidden className="block h-[3px] w-[97%] rounded-full bg-hairline" />
              <span aria-hidden className="block h-[3px] w-[78%] rounded-full bg-hairline" />
              <span aria-hidden className="block h-[3px] w-[88%] rounded-full bg-hairline" />
              <span aria-hidden className="block h-[3px] w-[56%] rounded-full bg-hairline" />
            </div>
          </div>

          {/* What a review looks at. */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
              dir="auto"
            >
              {review.pointsLabel}
            </p>
            <ul className="mt-4 border-t border-hairline">
              {review.points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 border-b border-hairline py-3.5 text-[15px] text-navy"
                >
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-hairline" />
                  <span dir="auto">{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-muted" dir="auto">
              {review.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}