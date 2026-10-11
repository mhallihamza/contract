import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Destination of each track, in dictionary order (§14). */
const TRACK_META = [{ href: "/assistant" }, { href: "/#review" }];

/** One numbered step inside a track. */
interface TrackStep {
  n: string;
  title: string;
  body: string;
}

/**
 * How it works (§14) — the two tracks, one per starting point.
 *
 * Nobody arrives in the same place: some visitors must create a document,
 * others already hold one. Each track therefore lists only its own steps, so
 * nobody has to read the other journey. Two columns split by a single hairline,
 * a numbered editorial list inside each — never a workflow diagram, never a
 * coloured card, no timing promised.
 */
export function HowItWorks({
  title,
  subtitle,
  tracks,
}: {
  title: string;
  subtitle: string;
  tracks: readonly {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    steps: readonly TrackStep[];
  }[];
}) {
  return (
    <section id="process" data-landing-section="process" className="bg-white py-24 lg:py-32">
      <div className="container-page space-y-12">
        <header className="max-w-2xl space-y-4">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
        </header>

        <div className="grid gap-10 border-t border-hairline pt-10 lg:grid-cols-2 lg:gap-0 lg:pt-12">
          {tracks.map((track, index) => {
            const meta = TRACK_META[index] ?? TRACK_META[0];
            return (
              <div
                key={track.title}
                className={
                  "flex flex-col " +
                  (index === 1 ? "lg:border-s lg:border-hairline lg:ps-14" : "lg:pe-14")
                }
              >
                <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  <span aria-hidden className="h-px w-6 bg-brass" />
                  <span dir="auto">{track.eyebrow}</span>
                </p>
                <h3
                  className="mt-5 text-[1.375rem] font-semibold tracking-[-0.01em] text-navy lg:text-[1.5rem]"
                  dir="auto"
                >
                  {track.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted" dir="auto">
                  {track.body}
                </p>

                <ol className="mt-8 space-y-6">
                  {track.steps.map((step) => (
                    <li key={step.n} className="flex items-baseline gap-4">
                      <p className="text-[12px] font-semibold tabular-nums tracking-[0.14em] text-ink-muted">
                        {step.n}
                      </p>
                      <div className="space-y-1.5">
                        <p
                          className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-navy"
                          dir="auto"
                        >
                          {step.title}
                        </p>
                        <p className="text-[15px] leading-relaxed text-ink-muted" dir="auto">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <p className="pt-8">
                  <Link
                    href={meta.href}
                    className="group inline-flex items-center gap-2 text-[15px] font-semibold text-navy-deep underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-deep"
                  >
                    {track.cta}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}