import { FileText } from "lucide-react";

/**
 * Professional validation (§16) — dark navy band.
 *
 * The premium moment of the page: why some contracts deserve more than a
 * template, three short principles, and a dossier surface showing what a
 * verification actually contains. No lawyer names, no profiles, no bar
 * numbers — only the structure of the work.
 */
export function ProfessionalValidation({
  title,
  text,
  points,
  dossier,
}: {
  title: string;
  text: string;
  points: readonly { title: string; body: string }[];
  dossier: {
    label: string;
    type: string;
    statusLabel: string;
    status: string;
    infoLabel: string;
    items: readonly string[];
  };
}) {
  return (
    <section
      id="validation"
      data-landing-section="validation"
      className="bg-navy-deep py-24 text-white lg:py-32"
    >
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <header className="space-y-6">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-white sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-white/70 lg:text-[18px]" dir="auto">
            {text}
          </p>
          <ul className="border-t border-white/15">
            {points.map((point) => (
              <li key={point.title} className="border-b border-white/15 py-5">
                <p className="flex items-center gap-3 text-base font-semibold text-white" dir="auto">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {point.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60" dir="auto">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </header>

        {/* Dossier surface. */}
        <div className="rounded-[14px] border border-white/10 bg-white p-6 text-navy shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft">
                <FileText className="h-5 w-5 text-accent" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  {dossier.label}
                </p>
                <p className="text-[15px] font-semibold text-navy" dir="auto">
                  {dossier.type}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-hairline pt-4">
            <p className="text-[13px] text-ink-muted" dir="auto">
              {dossier.statusLabel}
            </p>
            <span
              className="rounded-full bg-warning/10 px-3 py-1 text-[12px] font-semibold text-warning"
              dir="auto"
            >
              {dossier.status}
            </span>
          </div>

          <div className="mt-5 border-t border-hairline pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              {dossier.infoLabel}
            </p>
            <ul className="mt-3 space-y-2.5">
              {dossier.items.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[14px] text-navy" dir="auto">
                  <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
