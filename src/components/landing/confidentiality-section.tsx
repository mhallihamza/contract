import { Files, History, Lock } from "lucide-react";

/** Icons of the three guarantees, in dictionary order (§23). */
const ICONS = [Lock, Files, History];

/**
 * Confidentiality (§23) — dark navy panel inside the ivory section.
 *
 * One honest headline, one paragraph, three small points on a deep navy
 * surface. The wording only claims what the application actually does —
 * controlled access, centralised documents, dated history — and never
 * "military-grade" security.
 */
export function ConfidentialitySection({
  title,
  text,
  points,
}: {
  title: string;
  text: string;
  points: readonly { title: string; body: string }[];
}) {
  return (
    <section id="confidentialite" data-landing-section="confidentiality" className="bg-canvas py-24 lg:py-32">
      <div className="container-page">
        <div className="space-y-10 rounded-[16px] bg-navy-deep p-8 text-white sm:p-10 lg:p-14">
          <header className="max-w-2xl space-y-4">
            <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-white sm:text-[2.5rem] lg:text-[3rem]">
              {title}
            </h2>
            <p className="text-[17px] leading-relaxed text-white/70 lg:text-[18px]" dir="auto">
              {text}
            </p>
          </header>

          <ul className="grid gap-6 md:grid-cols-3">
            {points.map((point, index) => {
              const Icon = ICONS[index] ?? Lock;
              return (
                <li key={point.title} className="rounded-[12px] border border-white/10 bg-white/5 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.5} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white" dir="auto">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/60" dir="auto">
                    {point.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
