"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { QuestionnaireWizard } from "@/components/guest/questionnaire-wizard";
import { cn } from "@/lib/utils";

/**
 * The guided wizard's live preview (§9).
 *
 * A thin client shell around `QuestionnaireWizard`: on desktop the questionnaire
 * and a scrollable, paginated preview of the future document sit side by side;
 * on small screens the two become tabs, with the form first. The preview is the
 * same server-built, always-locked render the dossier shows — full text is
 * never revealed here, only where the visitor's answers land.
 */

export interface WizardPreviewLabels {
  formTab: string;
  previewTab: string;
  previewAria: string;
  /** Reuse of `checkout.locked` — the preview never promises the full text. */
  lockedNote: string;
  /** Reuse of `checkout.pages` — "…page(s) estimée(s)". */
  pageEstimate: string;
  /** Shown when the approved template has no clauses yet. */
  empty: string;
}

/** Serialisable wizard configuration — allows the shell to own the step callback. */
export type WizardConfig = Omit<
  Parameters<typeof QuestionnaireWizard>[0],
  "estimatedMinutes" | "onStepChange" | "locale"
> & {
  estimatedMinutes?: number;
};

type PreviewClauseLike = {
  code: string;
  titleFr: string;
  titleAr: string;
  previewFr: string;
  previewAr: string;
  variableKeys: readonly string[];
};

/** Structural subset of `ContractPreview` the panel renders. */
export interface WizardPreviewData {
  title: string;
  contractType: { nameFr: string; nameAr: string };
  clauses: readonly PreviewClauseLike[];
  sectionCount: number;
  clauseCount: number;
  estimatedPages: number;
  locked: true;
}

/** Groups clauses into pseudo-pages (~2 clauses or ~1400 characters each). */
function chunkIntoPages(clauses: readonly PreviewClauseLike[]): PreviewClauseLike[][] {
  const pages: PreviewClauseLike[][] = [];
  let current: PreviewClauseLike[] = [];
  let length = 0;
  for (const clause of clauses) {
    const clauseLength = clause.titleFr.length + clause.previewFr.length;
    if (current.length > 0 && (current.length >= 2 || length + clauseLength > 1400)) {
      pages.push(current);
      current = [];
      length = 0;
    }
    current.push(clause);
    length += clauseLength;
  }
  if (current.length > 0) pages.push(current);
  return pages;
}

function PreviewPage({
  clauses,
  pageNumber,
  totalPages,
  locale,
  activeKeys,
}: {
  clauses: readonly PreviewClauseLike[];
  pageNumber: number;
  totalPages: number;
  locale: "fr" | "ar";
  activeKeys: readonly string[];
}) {
  return (
    <div>
      {clauses.map((clause) => {
        const highlighted =
          activeKeys.length > 0 && clause.variableKeys.some((key) => activeKeys.includes(key));
        const title = locale === "ar" ? clause.titleAr : clause.titleFr;
        const body = locale === "ar" ? clause.previewAr : clause.previewFr;
        return (
          <div
            key={clause.code}
            data-clause={clause.code}
            className={cn(
              "rounded-md border px-3 py-2.5 transition-colors",
              highlighted
                ? "border-amber-400 bg-amber-50/80 dark:border-amber-500/60 dark:bg-amber-950/30"
                : "border-transparent",
            )}
          >
            <p className="mb-1 text-[12px] font-semibold text-navy" dir="auto">
              {title}
            </p>
            <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700" dir="auto">
              {body}
            </p>
          </div>
        );
      })}
      <p className="mt-3 border-t border-dashed border-slate-200 pt-1.5 text-center font-mono text-[11px] text-slate-400">
        Page {pageNumber} / {totalPages}
      </p>
    </div>
  );
}

/** The scrollable preview column — pages, estimate note and the locked notice. */
function PreviewColumn({
  preview,
  locale,
  activeKeys,
  labels,
}: {
  preview: WizardPreviewData;
  locale: "fr" | "ar";
  activeKeys: readonly string[];
  labels: WizardPreviewLabels;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pages = useMemo(() => chunkIntoPages(preview.clauses), [preview.clauses]);

  // The clause being filled follows the visitor: scroll it into view when the
  // step (and therefore the highlighted pointers) changes.
  const activeKeySignature = activeKeys.join("|");
  useEffect(() => {
    if (!activeKeySignature || !scrollRef.current) return;
    const highlighted = Array.from(
      scrollRef.current.querySelectorAll<HTMLElement>(".border-amber-400"),
    )[0];
    highlighted?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeKeySignature]);

  const title = locale === "ar" ? preview.contractType.nameAr : preview.contractType.nameFr;

  return (
    <div className="space-y-3" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="rounded-lg border border-hairline bg-canvas px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy" dir="auto">
          <FileText className="h-4 w-4 text-accent-strong" aria-hidden />
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-muted" dir="auto">
          {labels.pageEstimate.replace("{count}", String(preview.estimatedPages))}
          {preview.sectionCount > 0 ? ` · ${preview.sectionCount}` : ""}
        </p>
        <p className="mt-1 text-[11px] text-ink-faint" dir="auto">
          {labels.lockedNote}
        </p>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[62vh] space-y-3 overflow-y-auto rounded-xl border border-hairline bg-white p-4 shadow-sm"
        data-testid="wizard-preview-sheet"
      >
        {pages.length === 0 ? (
          <p className="text-[12px] text-slate-500" dir="auto">
            {labels.empty}
          </p>
        ) : (
          pages.map((pageClauses, index) => (
            <PreviewPage
              key={index}
              clauses={pageClauses}
              pageNumber={index + 1}
              totalPages={pages.length}
              locale={locale}
              activeKeys={activeKeys}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Desktop: `[questionnaire | preview]` two-column grid. Mobile: a tab strip
 * above the two panels, form first, preview one tap away.
 */
export function WizardWithPreview({
  wizard,
  preview,
  locale,
  previewLabels,
}: {
  wizard: WizardConfig;
  preview: WizardPreviewData | null;
  locale: "fr" | "ar";
  previewLabels: WizardPreviewLabels;
}) {
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [activeKeys, setActiveKeys] = useState<readonly string[]>([]);

  const handleStepChange = useCallback(
    (info: { stepIndex: number; fieldKeys: string[] }) => setActiveKeys(info.fieldKeys),
    [],
  );

  return (
    <div className="min-w-0">
      {/* Mobile tab strip — hidden from lg up, where the grid shows both. */}
      <div role="tablist" aria-label={previewLabels.previewAria} className="mb-4 flex gap-1.5 lg:hidden">
        {(["form", "preview"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
              tab === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground",
            )}
            dir="auto"
          >
            {value === "form" ? previewLabels.formTab : previewLabels.previewTab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div
          role="tabpanel"
          aria-label={previewLabels.formTab}
          className={cn("min-w-0", tab === "form" ? "" : "hidden lg:block")}
        >
          <QuestionnaireWizard {...wizard} locale={locale} onStepChange={handleStepChange} />
        </div>

        <div
          role="tabpanel"
          aria-label={previewLabels.previewTab}
          className={cn("min-w-0", tab === "preview" ? "" : "hidden lg:block")}
        >
          {preview ? (
            <div className="lg:sticky lg:top-24">
              <PreviewColumn preview={preview} locale={locale} activeKeys={activeKeys} labels={previewLabels} />
            </div>
          ) : (
            <div
              className="rounded-lg border border-hairline bg-canvas p-4 text-[12px] text-ink-muted"
              dir="auto"
            >
              {previewLabels.empty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
