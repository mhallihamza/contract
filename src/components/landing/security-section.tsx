import { Clock, Lock, ShieldCheck, UserRound } from "lucide-react";

/** One icon per security item, in dictionary order. */
const ITEM_ICONS = [Lock, UserRound, Clock, ShieldCheck];

/**
 * "Vos documents restent privés" (§15).
 *
 * Four statements the product actually implements: private links, role-scoped
 * access, a timestamped history and deletion on request. No badge, no logo, no
 * certification is displayed — the section claims only what the platform does.
 */
export function SecuritySection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: readonly { title: string; body: string }[];
}) {
  return (
    <section
      id="security"
      className="border-y border-hairline bg-canvas-tint px-4 py-16 sm:px-6 lg:py-20"
      data-landing-section="security"
    >
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="max-w-2xl space-y-2">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
            {subtitle}
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = ITEM_ICONS[index] ?? ShieldCheck;
            return (
              <li
                key={item.title}
                className="space-y-3 rounded-[18px] border border-hairline bg-white p-6"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent-soft text-accent"
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </span>
                <h3 className="text-base font-semibold text-navy" dir="auto">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
