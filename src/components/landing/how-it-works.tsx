import { FilePlus2, FileUp } from "lucide-react";
import { SimulatorJump } from "@/components/landing/simulator-jump";

/** One numbered step inside a parcours; the tier box follows its own step. */
interface TrackStep {
  title: string;
  body: string;
}

/** One parcours card: header, steps, the with/without tier box, the CTA. */
interface Track {
  title: string;
  price: string;
  steps: readonly TrackStep[];
  tierBox: {
    left: { title: string; price: string; body: string };
    right: { title: string; price: string; body: string };
  };
  cta: string;
  /**
   * Which parcours the CTA announces to the simulator — "create" or "verify".
   * `string` because dictionaries arrive `DeepWiden`-ed; the card narrows it
   * back with `=== "create"` and treats anything else as verify.
   */
  ctaHref: string;
}

/**
 * How it works (§14) — the two parcours of the Wathiqa page: create a
 * document, or verify one you already hold. Each card lists only its own
 * steps, with the pricing choice shown exactly where the choice happens.
 * The CTAs dispatch the visitor's intent into the simulator below.
 */
export function HowItWorks({
  eyebrow,
  title,
  subtitle,
  createTrack,
  verifyTrack,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  createTrack: Track;
  verifyTrack: Track;
}) {
  return (
    <section
      id="how-it-works"
      data-landing-section="process"
      className="border-b border-hairline bg-white py-20"
    >
      <div className="container-page">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
            {eyebrow}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl" dir="auto">
            {title}
          </h2>
          <p className="mt-3 text-base font-normal text-ink-soft" dir="auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ParcoursCard track={createTrack} tone="create" />
          <ParcoursCard track={verifyTrack} tone="verify" />
        </div>
      </div>
    </section>
  );
}

function ParcoursCard({ track, tone }: { track: Track; tone: "create" | "verify" }) {
  const icon =
    tone === "create" ? (
      <FilePlus2 className="h-5 w-5" aria-hidden />
    ) : (
      <FileUp className="h-5 w-5" aria-hidden />
    );

  const cardClass =
    tone === "create"
      ? "flex flex-col justify-between rounded-2xl border border-hairline bg-canvas p-6 sm:p-8"
      : "flex flex-col justify-between rounded-2xl border-2 border-navy-mid/20 bg-white p-6 shadow-md sm:p-8";

  const ctaIntent =
    track.ctaHref === "create"
      ? ({ mode: "create" } as const)
      : ({ mode: "verify" } as const);

  return (
    <div className={cardClass}>
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-mid text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy" dir="auto">
              {track.title}
            </h3>
            <p className="font-mono text-xs text-ink-soft" dir="auto">
              {track.price}
            </p>
          </div>
        </div>

        <ol className="space-y-5">
          {track.steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-mid text-sm font-bold text-white">
                {index + 1}
              </div>
              <div className="w-full">
                <h4 className="text-sm font-bold text-navy" dir="auto">
                  {step.title}
                </h4>
                {step.body ? (
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft" dir="auto">
                    {step.body}
                  </p>
                ) : null}

                {/* The tier box sits inside its own step, as on the brand page. */}
                {index === (tone === "create" ? 2 : 1) ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1 rounded-lg border border-hairline bg-white p-3">
                      <p className="text-xs font-bold text-navy" dir="auto">
                        {track.tierBox.left.title}{" "}
                        <span className="font-mono text-ink-soft">{track.tierBox.left.price}</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-ink-soft" dir="auto">
                        {track.tierBox.left.body}
                      </p>
                    </div>
                    <div className="space-y-1 rounded-lg border border-brass-bright/30 bg-brass-tint/60 p-3">
                      <p className="text-xs font-bold text-navy" dir="auto">
                        {track.tierBox.right.title}{" "}
                        <span className="font-mono text-brass-text">{track.tierBox.right.price}</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-ink-soft" dir="auto">
                        {track.tierBox.right.body}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <SimulatorJump
        intent={ctaIntent}
        className={`mt-6 block w-full rounded-xl py-2.5 text-center text-xs font-bold text-white transition-colors ${
          tone === "create"
            ? "bg-navy hover:bg-ink-deep"
            : "bg-accent hover:bg-navy-mid"
        }`}
      >
        <span dir="auto">{track.cta}</span>
      </SimulatorJump>
    </div>
  );
}
