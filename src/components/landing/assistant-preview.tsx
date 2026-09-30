import Link from "next/link";
import { ArrowRight, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Vous écrivez, la plateforme structure" (§13).
 *
 * One user message on the left, the structured request the platform derives
 * from it on the right (type, identified document, missing information, next
 * step). The panel is the product promise made visible: nothing magic, a
 * readable transformation — and the note states it is an example, not data.
 */
export function AssistantPreview({
  title,
  subtitle,
  cta,
  assistant,
}: {
  title: string;
  subtitle: string;
  cta: string;
  assistant: {
    messageLabel: string;
    userMessage: string;
    panelTitle: string;
    typeLabel: string;
    typeValue: string;
    documentLabel: string;
    documentValue: string;
    missingLabel: string;
    missingItems: readonly string[];
    nextLabel: string;
    nextValue: string;
    note: string;
  };
}) {
  return (
    <section
      id="assistant-preview"
      className="border-y border-hairline bg-canvas-tint px-4 py-16 sm:px-6 lg:py-20"
      data-landing-section="assistant"
    >
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-[2rem]">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
              {subtitle}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 rounded-[12px] border-hairline bg-white px-5 text-navy hover:bg-white/70"
          >
            <Link href="/assistant">
              {cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {/* What the visitor writes — one sentence, no legal vocabulary. */}
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {assistant.messageLabel}
            </p>
            <p
              className="rounded-[20px] rounded-ee-[6px] border border-hairline bg-white px-5 py-4 text-sm leading-relaxed text-navy sm:text-base"
              dir="auto"
            >
              {assistant.userMessage}
            </p>
            <p className="text-xs leading-relaxed text-ink-muted" dir="auto">
              {assistant.note}
            </p>
          </div>

          {/* What the platform makes of it. */}
          <dl className="space-y-5 rounded-[20px] border border-hairline bg-white p-6 shadow-[0_24px_48px_-38px_rgba(16,27,53,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {assistant.panelTitle}
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                  {assistant.typeLabel}
                </dt>
                <dd className="text-sm font-medium text-navy" dir="auto">
                  {assistant.typeValue}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                  {assistant.documentLabel}
                </dt>
                <dd className="font-serif text-base font-semibold text-navy" dir="auto">
                  {assistant.documentValue}
                </dd>
              </div>
            </div>

            <div className="space-y-2">
              <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                {assistant.missingLabel}
              </dt>
              <dd className="flex flex-wrap gap-2">
                {assistant.missingItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-hairline bg-canvas px-3 py-1 text-xs text-navy"
                    dir="auto"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>

            <div className="space-y-1 border-t border-hairline pt-4">
              <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                {assistant.nextLabel}
              </dt>
              <dd className="flex items-start gap-2 text-sm text-navy" dir="auto">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {assistant.nextValue}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
