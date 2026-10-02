import { FileText } from "lucide-react";

/**
 * For businesses and professionals (§13).
 *
 * One compact preview and nothing more: a small "Mes contrats" list with three
 * rows and their status. No metrics, no activity timeline, no dashboard, no
 * invented figures — and the demonstration notice stays visible.
 */
export function BusinessSection({
  title,
  text,
  business,
}: {
  title: string;
  text: string;
  business: {
    title: string;
    rows: readonly { name: string; status: string }[];
    note: string;
  };
}) {
  return (
    <section id="business" data-landing-section="business" className="bg-canvas py-24 lg:py-32">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <header className="space-y-5">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div className="rounded-[12px] border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(23,43,58,0.04),0_14px_34px_rgba(23,43,58,0.06)] sm:p-6">
          <p className="flex items-center gap-2.5 text-[14px] font-semibold text-navy">
            <FileText className="h-4 w-4 shrink-0 text-navy-deep" strokeWidth={1.5} aria-hidden />
            <span dir="auto">{business.title}</span>
          </p>

          <ul className="mt-4 border-t border-hairline">
            {business.rows.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-4 border-b border-hairline py-3 text-[14px]"
              >
                <span className="min-w-0 truncate text-navy" dir="auto">
                  {row.name}
                </span>
                <span
                  className="shrink-0 rounded-full border border-hairline px-2.5 py-0.5 text-[11px] font-medium text-ink-muted"
                  dir="auto"
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] leading-relaxed text-ink-muted" dir="auto">
            {business.note}
          </p>
        </div>
      </div>
    </section>
  );
}