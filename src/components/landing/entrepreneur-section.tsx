import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

/** Destinations of the three situations, in dictionary order (§17). */
const HREFS = [
  "/contracts?category=SERVICES",
  "/contracts?category=PARTNERSHIP",
  "/contracts?category=EMPLOYMENT",
];

/**
 * For entrepreneurs (§17).
 *
 * Three moments every Moroccan founder recognises — first client, new
 * partner, first hire — each shown as a minimal document card that links to
 * the matching catalogue family. Practical, not decorative.
 */
export function EntrepreneurSection({
  title,
  text,
  cases,
}: {
  title: string;
  text: string;
  cases: readonly { tag: string; doc: string }[];
}) {
  return (
    <section id="entrepreneurs" data-landing-section="entrepreneur" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-10 lg:space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {text}
          </p>
        </header>

        <ul className="grid gap-6 md:grid-cols-3">
          {cases.map((item, index) => (
            <li key={item.tag} className="flex">
              <Link
                href={HREFS[index] ?? "/contracts"}
                className="group flex h-full w-full flex-col gap-6 rounded-[12px] border border-hairline bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,33,63,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent" dir="auto">
                    {item.tag}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-canvas">
                    <FileText className="h-4 w-4 text-accent" strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
                <p className="text-lg font-semibold text-navy lg:text-xl" dir="auto">
                  {item.doc}
                </p>
                <span className="mt-auto">
                  <ArrowRight
                    className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
