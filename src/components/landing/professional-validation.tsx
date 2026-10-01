import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

/**
 * Professional validation (§18) — white section.
 *
 * Why some dossiers deserve particular attention: headline, one careful
 * sentence, three short principles, then a dossier surface with a done /
 * pending checklist and a shield icon. No lawyer names, no profiles, no bar
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
    items: readonly { label: string; done: boolean }[];
  };
}) {
  return (
    <section id="validation" data-landing-section="validation" className="bg-white py-24 lg:py-32">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <header className="space-y-6">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
          <ul className="border-t border-hairline">
            {points.map((point) => (
              <li key={point.title} className="border-b border-hairline py-5">
                <p className="flex items-center gap-3 text-base font-semibold text-navy" dir="auto">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {point.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted" dir="auto">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </header>

        {/* Dossier surface: status + checklist. */}
        <div className="rounded-[14px] border border-hairline bg-canvas p-6 shadow-[0_10px_30px_rgba(16,33,63,0.06)] sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-hairline bg-white">
              <ShieldCheck className="h-5 w-5 text-accent" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted"
                dir="auto"
              >
                {dossier.label}
              </p>
              <p className="text-[15px] font-semibold text-navy" dir="auto">
                {dossier.type}
              </p>
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
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              dir="auto"
            >
              {dossier.infoLabel}
            </p>
            <ul className="mt-3 space-y-2.5">
              {dossier.items.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[14px]" dir="auto">
                  {item.done ? (
                    <CheckCircle2
                      className="h-[18px] w-[18px] shrink-0 text-success"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className="h-[18px] w-[18px] shrink-0 text-ink-muted/40"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  )}
                  <span className={item.done ? "text-navy" : "text-ink-muted"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
