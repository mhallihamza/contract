import { History, Lock, Search, ShieldCheck } from "lucide-react";

/** Icons of the four trust items, in dictionary order (§10). */
const ICONS = [Lock, Search, ShieldCheck, History];

/**
 * Trust strip under the hero (§10).
 *
 * Four plain statements with a thin icon and hairline separators — no numbers,
 * no percentages, no invented figures. The strip is a full-bleed white band
 * between the ivory hero and the first content section.
 */
export function TrustBar({ items }: { items: readonly string[] }) {
  return (
    <section data-landing-section="trust" className="border-y border-hairline bg-white">
      <div className="container-page grid grid-cols-1 lg:grid-cols-4">
        {items.map((label, index) => {
          const Icon = ICONS[index] ?? Lock;
          return (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 border-t border-hairline px-4 py-4 first:border-t-0 lg:border-t-0 lg:border-s lg:px-6 lg:first:border-s-0"
            >
              <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} aria-hidden />
              <span className="text-center text-[13px] font-medium text-navy" dir="auto">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
