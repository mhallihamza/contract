import { ShieldCheck } from "lucide-react";

/**
 * Professional validation (§12) — the one dark band of the page.
 *
 * Restrained: headline, one careful sentence, and a single document card that
 * states the type of contract, the service and its status. No lawyer photos,
 * no names, no profiles, no credentials, no bar numbers: the subject is the
 * service, never a fictional person.
 */
export function ProfessionalValidation({
  title,
  text,
  card,
}: {
  title: string;
  text: string;
  card: { label: string; type: string; service: string; status: string };
}) {
  return (
    <section
      id="validation"
      data-landing-section="validation"
      className="bg-navy-deep py-24 text-white lg:py-32"
    >
      <div className="container-page grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-20">
        <header className="space-y-5">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-white sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-white/70 lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <div className="rounded-[12px] border border-white/15 bg-white/[0.04] p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50" dir="auto">
            {card.label}
          </p>
          <p className="mt-3 flex items-center gap-3 text-[17px] font-semibold text-white">
            <ShieldCheck className="h-5 w-5 shrink-0 text-white/60" strokeWidth={1.5} aria-hidden />
            <span dir="auto">{card.type}</span>
          </p>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-[14px]">
            <span className="text-white/65" dir="auto">
              {card.service}
            </span>
            <span
              className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium text-white/80"
              dir="auto"
            >
              {card.status}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}