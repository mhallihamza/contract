import { Check, Minus } from "lucide-react";
import { SimulatorJump } from "@/components/landing/simulator-jump";

/** The four destinations a pricing CTA can announce to the simulator. */
const INTENT: Record<
  string,
  { mode: "create" | "verify"; docType?: "bail" | "cdi" | "prestation"; tier?: "sans" | "avocat" | "assistee" }
> = {
  create: { mode: "create" },
  verify: { mode: "verify" },
  "create-avocat": { mode: "create", tier: "avocat" },
  "verify-assist": { mode: "verify", tier: "assistee" },
};

/** Copy shape of `d.public.home.pricing` — FR reference, AR mirror. */
export interface PricingTier {
  badge: string;
  title: string;
  sub: string;
  price: string;
  unit: string;
  features: readonly { text: string; included: boolean }[];
  cta: string;
  /** One of `INTENT`'s keys; `string` because dictionaries are `DeepWiden`-ed. */
  ctaHref: string;
  /** Card treatment — "dark" (recommended), "accent" or "sand". */
  tone: string;
}

/**
 * Services and pricing (§9) — the three ways a document leaves this platform.
 *
 * One card per offer, each anchored on the action it sells: self-service
 * drafting, assisted verification of an existing file, or a lawyer's signed
 * review. Every price is announced with its tax note and the fee basis — the
 * page never hides a number behind "contact us". The CTAs announce their
 * intent to the simulator so the wizard opens preselected.
 */
export function PricingSection({
  eyebrow,
  title,
  subtitle,
  recommended,
  tiers,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  recommended: string;
  tiers: readonly PricingTier[];
}) {
  return (
    <section
      id="services"
      data-landing-section="pricing"
      className="border-b border-hairline bg-canvas py-20"
    >
      <div className="container-page">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
            {eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-4xl" dir="auto">
            {title}
          </h2>
          <p className="mt-4 text-lg text-ink-muted" dir="auto">
            {subtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const dark = tier.tone === "dark";
            const accent = tier.tone === "accent";

            return (
              <article
                key={tier.title}
                dir="auto"
                className={
                  dark
                    ? "relative flex flex-col rounded-2xl border border-navy-deep bg-navy-deep p-7 text-accent-tint shadow-xl"
                    : accent
                      ? "relative flex flex-col rounded-2xl border-2 border-accent bg-white p-7 shadow-lg"
                      : "relative flex flex-col rounded-2xl border border-hairline bg-white p-7"
                }
              >
                {dark ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-brass px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-navy-deep">
                    {recommended}
                  </span>
                ) : null}

                <p className={`font-mono text-xs font-bold uppercase tracking-widest ${dark ? "text-brass-bright" : "text-brass-text"}`}>
                  {tier.badge}
                </p>
                <h3 className={`mt-2 font-serif text-xl font-bold ${dark ? "text-white" : "text-navy"}`}>
                  {tier.title}
                </h3>
                <p className={`text-sm ${dark ? "text-accent-tint/75" : "text-ink-muted"}`}>{tier.sub}</p>

                <p className="mt-5 flex items-baseline gap-2">
                  <span className={`font-serif text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-navy"}`}>
                    {tier.price}
                  </span>
                  <span className={`text-xs ${dark ? "text-accent-tint/70" : "text-ink-soft"}`}>{tier.unit}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-accent-contrast" : "text-accent-strong"}`} />
                      ) : (
                        <Minus aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                      )}
                      <span className={feature.included ? (dark ? "text-accent-tint" : "text-navy") : dark ? "text-accent-tint/50 line-through" : "text-ink-faint line-through"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <SimulatorJump
                  intent={INTENT[tier.ctaHref]}
                  className={
                    dark
                      ? "mt-7 inline-flex w-full items-center justify-center rounded-lg bg-accent-bright px-5 py-2.5 text-sm font-semibold text-navy-deep transition-colors hover:bg-white"
                      : accent
                        ? "mt-7 inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
                        : "mt-7 inline-flex w-full items-center justify-center rounded-lg border border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
                  }
                >
                  {tier.cta}
                </SimulatorJump>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
