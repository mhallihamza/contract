import Link from "next/link";
import { ArrowDown, ArrowRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * From the need to the structured request (§11).
 *
 * Left: the plain-language promise. Right: a two-step product surface — what
 * the visitor writes, then what the platform derives from it (type, parties,
 * object, next step). The example is explicitly labelled as an illustration.
 */
export function NeedSection({
  title,
  subtitle,
  need,
}: {
  title: string;
  subtitle: string;
  need: {
    inputLabel: string;
    platformLabel: string;
    platformMessage: string;
    userMessage: string;
    fields: readonly { label: string; value: string }[];
    cta: string;
    note: string;
  };
}) {
  return (
    <section id="besoin" data-landing-section="need" className="bg-white py-24 lg:py-32">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <header className="space-y-5">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-muted lg:text-[18px]" dir="auto">
            {subtitle}
          </p>
        </header>

        <div className="space-y-4">
          {/* What the visitor writes. */}
          <div className="rounded-[14px] border border-hairline bg-canvas p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              <span dir="auto">{need.inputLabel}</span>
            </p>
            <p className="mt-2.5 text-[15px] leading-relaxed text-navy" dir="auto">
              « {need.userMessage} »
            </p>
          </div>

          <div className="flex justify-center" aria-hidden>
            <ArrowDown className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
          </div>

          {/* What the request becomes — platform header + derived fields. */}
          <div className="rounded-[14px] border border-hairline bg-white p-6 shadow-[0_10px_30px_rgba(16,33,63,0.06)]">
            <header className="border-b border-hairline pb-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
                dir="auto"
              >
                {need.platformLabel}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-navy" dir="auto">
                {need.platformMessage}
              </p>
            </header>
            <dl className="mt-4 divide-y divide-hairline">
              {need.fields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    {field.label}
                  </dt>
                  <dd className="text-end text-[15px] font-medium text-navy" dir="auto">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-hairline pt-5">
              <p className="text-[11px] text-ink-muted" dir="auto">
                {need.note}
              </p>
              <Button
                asChild
                className="h-10 shrink-0 rounded-[10px] bg-accent px-5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-navy-mid focus-visible:ring-accent"
              >
                <Link href="/assistant">
                  {need.cta}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
