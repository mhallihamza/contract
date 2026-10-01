import Link from "next/link";
import { ArrowRight, Check, Circle, CircleDot, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shape of the contract-workspace mockup on the right of the hero (§9). */
export interface HeroWorkspace {
  ref: string;
  status: string;
  sidebarLabel: string;
  sidebar: readonly string[];
  docTitle: string;
  docMeta: readonly string[];
  sections: readonly string[];
  statesLabel: string;
  states: readonly { label: string; state: string }[];
  card: { label: string; subject: string; status: string; cta: string };
}

/**
 * Hero of the homepage (§6–§12) — 46/54 split. The promise on the left; on
 * the right a contract-workspace composition built entirely from interface
 * elements. Zero photography: the visitor sees the product itself. Every
 * string comes from the dictionary so Arabic states the same promise.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  reassurance,
  workspace,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  reassurance: string;
  workspace: HeroWorkspace;
}) {
  return (
    <section data-landing-section="hero" className="bg-canvas">
      <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[46fr_54fr] lg:gap-16 lg:py-24">
        {/* Left — the promise. */}
        <div className="space-y-6">
          <p className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden className="h-px w-7 bg-gold" />
            <span dir="auto">{eyebrow}</span>
          </p>

          <h1 className="text-[2.625rem] font-semibold leading-[1.02] tracking-[-0.02em] text-navy sm:text-[3.25rem] lg:text-[4rem]">
            {title}
          </h1>

          <p className="max-w-xl text-lg leading-[1.6] text-ink-muted xl:text-xl" dir="auto">
            {subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[12px] bg-accent px-7 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(16,33,63,0.12)] transition hover:-translate-y-0.5 hover:bg-navy-mid focus-visible:ring-accent"
            >
              <Link href="/assistant">
                {primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[12px] border-hairline bg-white px-7 text-[15px] font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-canvas focus-visible:ring-accent"
            >
              <Link href="/#services">{secondaryCta}</Link>
            </Button>
          </div>

          <p className="text-sm text-ink-muted" dir="auto">
            {reassurance}
          </p>
        </div>

        {/* Right — the contract workspace, pure UI. */}
        <div className="relative">
          <div className="overflow-hidden rounded-[14px] border border-hairline bg-white shadow-[0_10px_30px_rgba(16,33,63,0.08)]">
            {/* Window bar: dossier reference, status, controls. */}
            <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-3">
              <p className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-navy" dir="auto">
                <FileText className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
                <span className="truncate">{workspace.ref}</span>
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent"
                  dir="auto"
                >
                  {workspace.status}
                </span>
                <span aria-hidden className="hidden items-center gap-1.5 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-hairline" />
                  <span className="h-2 w-2 rounded-full bg-hairline" />
                  <span className="h-2 w-2 rounded-full bg-hairline" />
                </span>
              </div>
            </div>

            <div className="flex">
              {/* Dossier sidebar — hidden on phones to keep the mock compact. */}
              <nav
                aria-label={workspace.sidebarLabel}
                className="hidden w-40 shrink-0 border-e border-hairline bg-canvas p-3 sm:block"
              >
                <p
                  className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
                  dir="auto"
                >
                  {workspace.sidebarLabel}
                </p>
                <ul className="space-y-1">
                  {workspace.sidebar.map((entry, index) => (
                    <li key={entry}>
                      <span
                        className={
                          index === 1
                            ? "block rounded-[8px] border border-hairline bg-white px-2.5 py-2 text-[13px] font-semibold text-accent"
                            : "block rounded-[8px] px-2.5 py-2 text-[13px] text-ink-muted"
                        }
                        dir="auto"
                      >
                        {entry}
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Document preview: title, metadata, sections 01–06. */}
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <p className="text-[15px] font-semibold text-navy" dir="auto">
                  {workspace.docTitle}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                  {workspace.docMeta.map((meta, index) => (
                    <span key={meta} className="flex items-center gap-2" dir="auto">
                      {index > 0 ? <span aria-hidden className="h-1 w-1 rounded-full bg-hairline" /> : null}
                      {meta}
                    </span>
                  ))}
                </p>

                <div className="mt-4 space-y-3.5 rounded-[10px] border border-hairline bg-canvas p-4">
                  {workspace.sections.map((section, index) => (
                    <div key={section} className="space-y-1.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy">
                        <span className="tabular-nums text-ink-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span dir="auto">{section}</span>
                      </p>
                      <span aria-hidden className="block h-1.5 w-full rounded-full bg-hairline" />
                      <span aria-hidden className="block h-1.5 w-[72%] rounded-full bg-hairline" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Dossier status panel — hidden below md to avoid overflow. */}
              <div className="hidden w-48 shrink-0 border-s border-hairline p-4 md:block">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
                  dir="auto"
                >
                  {workspace.statesLabel}
                </p>
                <ul className="mt-3 space-y-3">
                  {workspace.states.map((step) => (
                    <li key={step.label} className="flex items-start gap-2.5 text-[13px]">
                      {step.state === "done" ? (
                        <Check className="mt-px h-4 w-4 shrink-0 text-success" strokeWidth={2.25} aria-hidden />
                      ) : step.state === "current" ? (
                        <CircleDot className="mt-px h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
                      ) : (
                        <Circle className="mt-px h-4 w-4 shrink-0 text-ink-muted/40" strokeWidth={1.75} aria-hidden />
                      )}
                      <span
                        className={step.state === "pending" ? "text-ink-muted" : "font-medium text-navy"}
                        dir="auto"
                      >
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* One floating card: validation, overlapping the window edge. */}
          <div className="relative z-10 mx-5 -mt-10 sm:mx-10 lg:absolute lg:-bottom-7 lg:-start-6 lg:mx-0 lg:mt-0 lg:w-[17.5rem]">
            <div className="rounded-[14px] border border-hairline bg-white p-4 shadow-[0_10px_30px_rgba(16,33,63,0.14)] sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted" dir="auto">
                {workspace.card.label}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-navy" dir="auto">
                {workspace.card.subject}
              </p>
              <p className="mt-1 flex items-center gap-2 text-[13px] font-medium text-success" dir="auto">
                <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                {workspace.card.status}
              </p>
              <p
                className="mt-3 flex items-center justify-between gap-2 border-t border-hairline pt-3 text-[13px] font-semibold text-accent"
                dir="auto"
              >
                {workspace.card.cta}
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


