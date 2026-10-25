"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  FilePlus2,
  FileText,
  FileUp,
  Home,
  Scale,
  X,
} from "lucide-react";
import { SIM_EVENT, type SimIntent } from "@/components/landing/simulator-jump";

/** Broadcast an intent so the wizard preselects a mode/type/tier. */
const dispatchSimIntent = (intent: SimIntent) =>
  window.dispatchEvent(new CustomEvent<SimIntent>(SIM_EVENT, { detail: intent }));

/** Copy shape of `d.public.home.simulator` — FR reference, AR mirror. */
export interface SimulatorCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  choiceLabel: string;
  choiceCreate: { title: string; body: string };
  choiceVerify: { title: string; body: string };
  back: string;
  stepsCreate: readonly string[];
  stepsVerify: readonly string[];
  labels: {
    createType: string;
    createInfo: string;
    createTier: string;
    createFinal: string;
    verifyUpload: string;
    verifyTier: string;
    verifyFinal: string;
  };
  continueBtn: string;
  toTierBtn: string;
  prev: string;
  sendBtn: string;
  typeIntro: string;
  docTypes: Record<DocType, { title: string; sub: string }>;
  tierIntro: string;
  tierWarning: string;
  createTiers: Record<
    CreateTier,
    { label: string; price: string; desc: string; note?: string; cta: string }
  >;
  verifyTiers: Record<
    VerifyTier,
    { label: string; price: string; desc: string; note?: string }
  >;
  uploadIntro: string;
  uploadCta: string;
  uploadFormats: string;
  uploadWarning: string;
  confirmTitle: string;
  confirmBody: string;
  launchCta: string;
  previewLabel: string;
  previewNote: string;
  previewWaiting: string;
  fileRemoveLabel: string;
  finalRecapLabel: string;
  finalLawyerTitle: string;
  finalLawyerBody: string;
  finalReadyTitle: string;
  finalReadyBody: string;
  finalNoReviewNote: string;
  handoffNote: string;
  liveHint: string;
  kingdomLabel: string;
  stampDraft: string;
  stampWaiting: string;
  stampSealLabel: string;
  liveBadge: string;
  signaturePlaceholder: string;
  stampLegalized: string;
  identityNote: string;
  docs: Record<DocType, DocCopy>;
}

interface DocCopy {
  title: string;
  kicker: string;
  heading: string;
  ref: string;
  /** Two signature labels, in paper order — widened `string[]` (dictionaries are `DeepWiden`-ed). */
  sigLabels: readonly string[];
  groups: readonly {
    subLabel: string;
    fields: readonly { label: string; value: string }[];
  }[];
  /** Two token keys (e.g. f0_0) that drive the signature rows. */
  sigTokens: readonly string[];
  /** Template paragraphs — {f0_0}-style tokens fill from the wizard state. */
  paper: readonly string[];
}

type DocType = "bail" | "cdi" | "prestation";
type CreateTier = "sans" | "avocat";
type VerifyTier = "assistee" | "avocat";
type View = "choice" | "create" | "verify";

/** Real destinations: the wizard hands off to the live guest pipeline. */
const SLUGS: Record<DocType, string> = {
  bail: "contrat-location-habitation",
  cdi: "contrat-travail-cdd",
  prestation: "contrat-prestation-services",
};

const DOC_ICONS: Record<DocType, typeof Home> = {
  bail: Home,
  cdi: Briefcase,
  prestation: FileText,
};

/** Tokens highlighted on the sheet, as on the brand page. */
const HIGHLIGHTS = new Set(["loyer", "caution_total", "salaire", "honoraires"]);

const num = (v: string | undefined) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
const fmtNum = (n: number) => n.toLocaleString("fr-FR");

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Fill a template with state: {tokens} become bold live values, "" → "...". */
function fill(
  template: string,
  state: Record<string, string>,
  extra: Record<string, string> = {},
) {
  const all = { ...state, ...extra };
  return template.split(/\{(\w+)\}/g).map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    const raw = all[part];
    const text = raw === undefined || raw === "" ? "..." : raw;
    return (
      <strong
        key={index}
        className={
          HIGHLIGHTS.has(part)
            ? "bg-accent-tint px-1 font-sans font-bold"
            : "font-sans font-bold"
        }
      >
        {text}
      </strong>
    );
  });
}

/**
 * The interactive document simulator — the Wathiqa wizard, wired to reality.
 *
 * Left panel: mode choice → the create wizard (type → guided field groups →
 * with/without lawyer → recap) or the verify flow (upload → control level →
 * confirmation), with the brand page's stepper and step labels. Right panel:
 * the live paper sheet that re-typesets on every keystroke, or the uploaded
 * document preview. The final action is a real POST to /api/guest/start with
 * the chosen document's slug — the same hand-off the product pages use — so
 * the simulation ends in the genuine questionnaire, never in a fake download.
 * All copy is injected from the dictionary.
 */
export function Simulator({ copy }: { copy: SimulatorCopy }) {
  const [view, setView] = useState<View>("choice");
  const [docType, setDocType] = useState<DocType>("bail");
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(0);
  const [createTier, setCreateTier] = useState<CreateTier | null>(null);
  const [tierWarn, setTierWarn] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const model of Object.values(copy.docs)) {
      for (const group of model.groups) {
        for (const field of group.fields) initial[field.label] = field.value;
      }
    }
    return initial;
  });
  const [vStep, setVStep] = useState(1);
  const [verifyTier, setVerifyTier] = useState<VerifyTier | null>(null);
  const [fileWarn, setFileWarn] = useState(false);
  const [vTierWarn, setVTierWarn] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [verifyRef, setVerifyRef] = useState("");
  const fileUrlRef = useRef<string | null>(null);

  const doc = copy.docs[docType];
  const group = doc.groups[Math.min(subStep, doc.groups.length - 1)];

  // Live derived values for the sheet (formatted amounts).
  const paperExtra = useMemo(() => {
    const extra: Record<string, string> = {};
    const findValue = (needle: string) => {
      for (const model of doc.groups) {
        for (const field of model.fields) {
          if (field.label.toLowerCase().includes(needle)) return values[field.label] ?? "";
        }
      }
      return "";
    };
    if (docType === "bail") {
      const loyer = num(findValue("loyer"));
      extra.loyer = fmtNum(loyer);
      extra.caution_total = fmtNum(loyer * num(findValue("caution") || "2"));
    } else if (docType === "cdi") {
      extra.salaire = fmtNum(num(findValue("salaire")));
    } else {
      extra.honoraires = fmtNum(num(findValue("montant total")));
    }
    return extra;
  }, [doc, docType, values]);

  // Live values keyed by field position — drives the two signature rows.
  const keyed = useMemo(() => {
    const map: Record<string, string> = {};
    doc.groups.forEach((model, gi) =>
      model.fields.forEach((field, fi) => {
        map[`f${gi}_${fi}`] = values[field.label] ?? "";
      }),
    );
    return map;
  }, [doc, values]);
  const sigA = keyed[doc.sigTokens[0]] ?? "";
  const sigB = keyed[doc.sigTokens[1]] ?? "";

  // The paper stamp flips to "waiting" once the lawyer tier is chosen on the
  // final step, exactly as on the brand page.
  const isWaiting = view === "create" && step === 4 && createTier === "avocat";
  const stampText = isWaiting ? copy.stampWaiting : copy.stampDraft;

  // Preselection events dispatched by the parcours cards, pricing, footer.
  useEffect(() => {
    const onIntent = (event: Event) => {
      const detail = (event as CustomEvent<SimIntent | undefined>).detail;
      if (!detail) return;
      if (detail.docType) setDocType(detail.docType);
      if (detail.mode === "create") {
        setView("create");
        if (detail.tier === "sans" || detail.tier === "avocat") setCreateTier(detail.tier);
        setStep(detail.docType ? 2 : 1);
        setSubStep(0);
        setTierWarn(false);
      } else {
        setView("verify");
        if (detail.tier === "assistee" || detail.tier === "avocat") setVerifyTier(detail.tier);
        setVStep(detail.tier ? 2 : 1);
        setFileWarn(false);
        setVTierWarn(false);
      }
    };
    window.addEventListener(SIM_EVENT, onIntent);
    return () => window.removeEventListener(SIM_EVENT, onIntent);
  }, []);

  useEffect(
    () => () => {
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    },
    [],
  );

  const steps = view === "verify" ? copy.stepsVerify : copy.stepsCreate;
  // Stepper items are 0-indexed while `step`/`vStep` are 1-based.
  const activeStep = view === "choice" ? 0 : view === "verify" ? vStep - 1 : step - 1;

  return (
    <section
      id="simulator"
      data-landing-section="simulator"
      className="border-b border-hairline bg-muted py-20"
    >
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
            {copy.eyebrow}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl" dir="auto">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-ink-soft" dir="auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left panel — mode choice, create wizard or verify flow. */}
          <div className="space-y-6 rounded-2xl border border-hairline bg-white p-6 shadow-sm sm:p-8 lg:col-span-5">
            {/* Progression — visible once a parcours is chosen. */}
            {view === "choice" ? null : (
              <nav aria-label="progress" className="pb-2">
                <ol className="flex items-start w-full">
                  {steps.map((label, index) => {
                    const done = index < activeStep;
                    const current = index === activeStep;
                    const last = index === steps.length - 1;
                    const circle = done
                      ? "bg-accent text-white"
                      : current
                        ? "border-2 border-accent bg-white text-navy-deep"
                        : "border border-line-strong bg-muted text-ink-faint";
                    const line = last ? null : (
                      <div
                        className={`mt-3.5 mx-1 h-0.5 flex-1 ${done ? "bg-accent" : "bg-hairline"}`}
                        aria-hidden
                      />
                    );
                    return (
                      <li
                        key={label}
                        className={`flex items-start ${last ? "" : "flex-1"}`}
                        aria-current={current ? "step" : undefined}
                      >
                        <div className="flex w-14 shrink-0 flex-col items-center sm:w-16">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${circle}`}
                          >
                            {done ? <Check className="h-3 w-3" aria-hidden /> : index + 1}
                          </span>
                          <span
                            className={`mt-1.5 text-center text-[10px] leading-tight ${
                              current ? "font-bold text-navy" : "text-ink-soft"
                            }`}
                            dir="auto"
                          >
                            {label}
                          </span>
                        </div>
                        {line}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {/* Mode choice (default view). */}
            {view === "choice" ? (
              <div className="space-y-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent" dir="auto">
                  {copy.choiceLabel}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setView("create");
                    setStep(1);
                    setSubStep(0);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-hairline bg-canvas p-4 text-start transition-all hover:border-accent-bright"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-mid text-white">
                    <FilePlus2 className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-navy" dir="auto">
                      {copy.choiceCreate.title}
                    </span>
                    <span className="block text-[11px] text-ink-soft" dir="auto">
                      {copy.choiceCreate.body}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("verify");
                    setVStep(1);
                    setFileWarn(false);
                    setVTierWarn(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-hairline bg-canvas p-4 text-start transition-all hover:border-accent-bright"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-mid text-white">
                    <FileUp className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-navy" dir="auto">
                      {copy.choiceVerify.title}
                    </span>
                    <span className="block text-[11px] text-ink-soft" dir="auto">
                      {copy.choiceVerify.body}
                    </span>
                  </span>
                </button>
              </div>
            ) : null}

            {view === "create" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent" dir="auto">
                    {step === 1
                      ? copy.labels.createType
                      : step === 2
                        ? `${copy.labels.createInfo} (${subStep + 1}/${doc.groups.length})`
                        : step === 3
                          ? copy.labels.createTier
                          : copy.labels.createFinal}
                  </span>
                  <button
                    type="button"
                    onClick={() => setView("choice")}
                    className="flex items-center gap-1 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
                  >
                    <ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden />
                    <span dir="auto">{copy.back}</span>
                  </button>
                </div>

                {/* Step 1 — type d'acte (cards advance on click). */}
                {step === 1 ? (
                  <div className="space-y-3">
                    <p className="mb-3 text-xs font-medium text-ink-soft" dir="auto">
                      {copy.typeIntro}
                    </p>
                    {(Object.keys(copy.docTypes) as DocType[]).map((type) => {
                      const Icon = DOC_ICONS[type];
                      const selected = docType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setDocType(type);
                            setStep(2);
                            setSubStep(0);
                          }}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-start transition-all ${
                            selected
                              ? "border-accent-strong bg-accent-tint/40"
                              : "border-hairline bg-canvas hover:border-accent-bright"
                          }`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-mid text-white">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-navy" dir="auto">
                              {copy.docTypes[type].title}
                            </span>
                            <span className="block text-[11px] text-ink-soft" dir="auto">
                              {copy.docTypes[type].sub}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* Step 2 — guided field groups. */}
                {step === 2 ? (
                  <div className="space-y-4">
                    <span
                      className="inline-block rounded bg-accent-tint px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-navy-deep"
                      dir="auto"
                    >
                      {group.subLabel}
                    </span>
                    {group.fields.map((field) => (
                      <div key={field.label} className="space-y-1">
                        <label
                          className="block text-xs font-bold text-ink-soft"
                          htmlFor={`sim-${field.label}`}
                          dir="auto"
                        >
                          {field.label}
                        </label>
                        <input
                          id={`sim-${field.label}`}
                          type="text"
                          value={values[field.label] ?? ""}
                          onChange={(event) =>
                            setValues((previous) => ({
                              ...previous,
                              [field.label]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-line-strong bg-canvas px-3 py-2 text-xs text-navy focus:border-accent-bright focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Step 3 — avec ou sans avocat. */}
                {step === 3 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-ink-soft" dir="auto">
                      {copy.tierIntro}
                    </p>
                    {(["sans", "avocat"] as const).map((key) => {
                      const tier = copy.createTiers[key];
                      const selected = createTier === key;
                      const isLawyer = key === "avocat";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setCreateTier(key);
                            setTierWarn(false);
                          }}
                          className={`block w-full cursor-pointer space-y-2 rounded-xl border-2 p-4 text-start transition-all ${
                            selected
                              ? isLawyer
                                ? "border-brass bg-brass-tint/50"
                                : "border-accent-strong bg-accent-tint/40"
                              : `border-hairline bg-canvas ${
                                  isLawyer
                                    ? "hover:border-brass-bright"
                                    : "hover:border-accent-bright"
                                }`
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span className="text-sm font-bold text-navy" dir="auto">
                              {tier.label}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                                isLawyer
                                  ? "bg-brass-tint text-brass-text"
                                  : "bg-accent-tint text-navy-deep"
                              }`}
                            >
                              {tier.price}
                            </span>
                          </span>
                          <span className="block text-[11px] text-ink-soft" dir="auto">
                            {tier.desc}
                          </span>
                          {tier.note ? (
                            <span
                              className="block rounded border border-brass-bright/30 bg-white p-2 text-[11px] font-medium text-ink-deep"
                              dir="auto"
                            >
                              {tier.note}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    {tierWarn ? (
                      <p
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600"
                        dir="auto"
                      >
                        {copy.tierWarning}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Step 4 — recap + branching + the real hand-off. */}
                {step === 4 && createTier ? (
                  <div className="space-y-4">
                    <div className="space-y-1 rounded-lg border border-hairline bg-muted p-3 font-mono text-xs">
                      <p className="text-ink-soft" dir="auto">
                        {copy.finalRecapLabel}
                      </p>
                      <p className="font-bold text-navy" dir="auto">
                        {doc.title}
                      </p>
                      <p className="text-accent" dir="auto">
                        {copy.createTiers[createTier].label} — {copy.createTiers[createTier].price}
                      </p>
                    </div>

                    {createTier === "avocat" ? (
                      <div className="space-y-2 rounded-xl border border-brass-bright/40 bg-brass-tint/60 p-4 text-xs">
                        <p className="flex items-center gap-2 font-bold text-navy" dir="auto">
                          <Scale className="h-4 w-4 text-brass" aria-hidden />
                          {copy.finalLawyerTitle}
                        </p>
                        <p className="text-ink-soft" dir="auto">
                          {copy.finalLawyerBody}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 rounded-xl border border-hairline bg-canvas p-4 text-xs">
                          <p className="flex items-center gap-2 font-bold text-navy" dir="auto">
                            <FileText className="h-4 w-4 text-red-600" aria-hidden />
                            {copy.finalReadyTitle}
                          </p>
                          <p className="text-ink-soft" dir="auto">
                            {copy.finalReadyBody}
                          </p>
                        </div>
                        <p
                          className="rounded border border-brass-bright/40 bg-brass-tint/60 p-2 text-[11px] font-medium text-brass-text"
                          dir="auto"
                        >
                          {copy.finalNoReviewNote}
                        </p>
                      </>
                    )}
                    {/* The real pipeline: POST /api/guest/start, like the product pages. */}
                    <form action="/api/guest/start" method="post" className="space-y-3">
                      <input type="hidden" name="slug" value={SLUGS[docType]} />
                      <p
                        className="rounded border border-hairline bg-white p-2 text-[11px] leading-relaxed text-ink-soft"
                        dir="auto"
                      >
                        {copy.handoffNote}
                      </p>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-mid"
                      >
                        <span dir="auto">{copy.createTiers[createTier].cta}</span>
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                      </button>
                    </form>

                    <div className="flex items-center justify-between border-t border-hairline pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-lg border border-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
                        dir="auto"
                      >
                        {copy.prev}
                      </button>
                    </div>
                  </div>
                ) : null}
                {/* Navigation — hidden on step 1 (cards advance on click). */}
                {step >= 2 && step <= 3 ? (
                  <div className="flex items-center justify-between border-t border-hairline pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 2) {
                          if (subStep > 0) setSubStep(subStep - 1);
                          else setStep(1);
                        } else if (step === 3) {
                          setStep(2);
                          setSubStep(doc.groups.length - 1);
                        }
                      }}
                      className="rounded-lg border border-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
                      dir="auto"
                    >
                      {copy.prev}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 2) {
                          if (subStep < doc.groups.length - 1) setSubStep(subStep + 1);
                          else setStep(3);
                        } else if (step === 3) {
                          if (!createTier) {
                            setTierWarn(true);
                            return;
                          }
                          setStep(4);
                        }
                      }}
                      className="flex items-center gap-1 rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-mid"
                    >
                      <span dir="auto">
                        {step === 2
                          ? subStep < doc.groups.length - 1
                            ? copy.continueBtn
                            : copy.toTierBtn
                          : copy.continueBtn}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {view === "verify" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent" dir="auto">
                    {vStep === 1
                      ? copy.labels.verifyUpload
                      : vStep === 2
                        ? copy.labels.verifyTier
                        : copy.labels.verifyFinal}
                  </span>
                  <button
                    type="button"
                    onClick={() => setView("choice")}
                    className="flex items-center gap-1 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
                  >
                    <ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden />
                    <span dir="auto">{copy.back}</span>
                  </button>
                </div>

                {/* Step 1 — real file upload. */}
                {vStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-ink-soft" dir="auto">
                      {copy.uploadIntro}
                    </p>
                    <label
                      htmlFor="verify-upload"
                      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all ${
                        file
                          ? "border-accent-strong bg-accent-tint/40"
                          : "border-line-strong bg-canvas hover:border-accent-bright hover:bg-accent-tint/20"
                      }`}
                    >
                      <FileUp
                        className={`h-8 w-8 ${file ? "text-accent" : "text-accent-strong"}`}
                        aria-hidden
                      />
                      <span className="text-sm font-medium text-navy" dir="auto">
                        {file ? file.name : copy.uploadCta}
                      </span>
                      <span className="text-xs text-ink-faint" dir="auto">
                        {copy.uploadFormats}
                      </span>
                      <input
                        id="verify-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*"
                        className="hidden"
                        onChange={(event) => {
                          const chosen = event.target.files?.[0] ?? null;
                          if (fileUrlRef.current) {
                            URL.revokeObjectURL(fileUrlRef.current);
                            fileUrlRef.current = null;
                          }
                          if (chosen) fileUrlRef.current = URL.createObjectURL(chosen);
                          setFile(chosen);
                          setFileWarn(false);
                          if (chosen) {
                            setVerifyRef(
                              `#${String(chosen.name.length * 7 + chosen.size).padStart(4, "0").slice(-4)}-MA`,
                            );
                          }
                        }}
                      />
                    </label>
                    {fileWarn ? (
                      <p
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600"
                        dir="auto"
                      >
                        {copy.uploadWarning}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Step 2 — niveau de contrôle. */}
                {vStep === 2 ? (
                  <div className="space-y-3">
                    {(["assistee", "avocat"] as const).map((key) => {
                      const tier = copy.verifyTiers[key];
                      const selected = verifyTier === key;
                      const isLawyer = key === "avocat";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setVerifyTier(key);
                            setVTierWarn(false);
                          }}
                          className={`block w-full cursor-pointer space-y-2 rounded-xl border-2 p-4 text-start transition-all ${
                            selected
                              ? isLawyer
                                ? "border-brass bg-brass-tint/50"
                                : "border-accent-strong bg-accent-tint/40"
                              : "border-hairline bg-canvas hover:border-accent-bright"
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span className="text-sm font-bold text-navy" dir="auto">
                              {tier.label}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                                isLawyer
                                  ? "bg-brass-tint text-brass-text"
                                  : "bg-accent-tint text-navy-deep"
                              }`}
                            >
                              {tier.price}
                            </span>
                          </span>
                          <span className="block text-[11px] text-ink-soft" dir="auto">
                            {tier.desc}
                          </span>
                          {tier.note ? (
                            <span
                              className="block rounded border border-brass-bright/30 bg-white p-2 text-[11px] font-medium text-ink-deep"
                              dir="auto"
                            >
                              {tier.note}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    {vTierWarn ? (
                      <p
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600"
                        dir="auto"
                      >
                        {copy.tierWarning}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {/* Step 3 — confirmation; the launch button leads to the real flow. */}
                {vStep === 3 ? (
                  <div className="space-y-6 py-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg">
                      <Check className="h-8 w-8" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy" dir="auto">
                        {copy.confirmTitle}
                      </h3>
                      <p className="mt-1 text-xs text-ink-soft" dir="auto">
                        {copy.confirmBody}
                      </p>
                    </div>
                    {file && verifyTier ? (
                      <div
                        className="mx-auto inline-block rounded-lg border border-hairline bg-muted px-4 py-2 font-mono text-xs text-ink-soft"
                        dir="auto"
                      >
                        {file.name} • {copy.verifyTiers[verifyTier].label} • Ref: {verifyRef}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => dispatchSimIntent({ mode: "create" })}
                      className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-navy-mid"
                    >
                      <span dir="auto">{copy.launchCta}</span>
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </button>
                  </div>
                ) : null}

                {/* Verify navigation. */}
                {vStep <= 2 ? (
                  <div className="flex items-center justify-between border-t border-hairline pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (vStep === 2) setVStep(1);
                        else setView("choice");
                      }}
                      className="rounded-lg border border-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
                      dir="auto"
                    >
                      {copy.prev}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (vStep === 1) {
                          if (!file) {
                            setFileWarn(true);
                            return;
                          }
                          setVStep(2);
                        } else if (vStep === 2) {
                          if (!verifyTier) {
                            setVTierWarn(true);
                            return;
                          }
                          setVStep(3);
                        }
                      }}
                      className="flex items-center gap-1 rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-mid"
                    >
                      <span dir="auto">{vStep === 1 ? copy.continueBtn : copy.sendBtn}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Right panel — the live paper sheet or the uploaded preview. */}
          <div className="lg:col-span-7">
            {view === "verify" ? (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-hairline bg-navy p-4 text-[11px] text-white shadow-sm">
                <p className="flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 shrink-0 text-brass-bright" aria-hidden />
                  <span className="font-bold" dir="auto">
                    {copy.previewLabel}
                  </span>
                  {copy.previewNote ? (
                    <span className="hidden text-white/60 sm:inline" dir="auto">
                      {copy.previewNote}
                    </span>
                  ) : null}
                </p>
                {file ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileUrlRef.current) {
                        URL.revokeObjectURL(fileUrlRef.current);
                        fileUrlRef.current = null;
                      }
                      setFile(null);
                      setVStep(1);
                    }}
                    className="flex max-w-[45%] items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold transition-colors hover:bg-white/20"
                  >
                    <span className="truncate" dir="auto">
                      {file.name}
                    </span>
                    <X className="h-3 w-3 shrink-0" aria-hidden />
                    <span dir="auto">{copy.fileRemoveLabel}</span>
                  </button>
                ) : (
                  <span className="text-white/70" dir="auto">
                    {copy.previewWaiting}
                  </span>
                )}
              </div>
            ) : (
              <p className="mb-4 text-center text-[11px] leading-relaxed text-ink-faint" dir="auto">
                {copy.liveHint}
              </p>
            )}

            {view === "verify" && file ? (
              file.type.startsWith("image/") && fileUrlRef.current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrlRef.current}
                  alt={file.name}
                  className="w-full rounded-lg border border-hairline bg-canvas p-2 shadow-xl"
                />
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-lg border border-hairline bg-white p-8 shadow-xl">
                  <FileText className="h-10 w-10 text-accent" aria-hidden />
                  <p className="font-mono text-sm font-bold text-navy" dir="auto">
                    {file.name}
                  </p>
                  <p className="text-xs text-ink-soft" dir="auto">
                    {copy.uploadFormats}
                  </p>
                </div>
              )
            ) : (
              <div className="paper-sheet relative rounded-lg border border-hairline p-8 font-serif text-sm leading-loose text-justify shadow-xl rtl:text-right lg:p-12">
                <div className="watermark-seal" aria-hidden />
                <div className="mb-8 flex items-start justify-between gap-4 border-b-2 border-ink-relaxed pb-6">
                  <div className="space-y-1">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-ink-soft" dir="auto">
                      {copy.kingdomLabel}
                    </p>
                    <p className="font-sans text-[9px] font-medium text-ink-faint" dir="auto">
                      {doc.kicker}
                    </p>
                  </div>
                  <div className="legal-stamp-seal shrink-0">
                    <span dir="auto">{stampText}</span>
                  </div>
                </div>

                <div className="mb-2 flex justify-between font-sans text-[10px] font-medium tracking-wide text-ink-soft">
                  <span dir="auto">{copy.liveBadge}</span>
                  <span>{doc.ref}</span>
                </div>

                <h4 className="mb-8 text-center font-serif text-lg font-bold tracking-wide text-ink-relaxed underline decoration-ink-faint underline-offset-8" dir="auto">
                  {doc.heading}
                </h4>

                {doc.paper.map((paragraph, index) => (
                  <p key={index} className="mb-4 text-ink-relaxed" dir="auto">
                    {fill(paragraph, keyed, paperExtra)}
                  </p>
                ))}

                <div className="mt-12 grid grid-cols-2 gap-8">
                  {doc.sigLabels.map((label, index) => {
                    const name = index === 0 ? sigA : sigB;
                    return (
                      <div key={label} className="flex flex-col items-center space-y-2">
                        <p
                          className="font-sans text-[9px] font-bold uppercase tracking-wider text-ink-soft"
                          dir="auto"
                        >
                          {label}
                        </p>
                        {name ? (
                          <span className="signature-font text-2xl text-navy-deep" dir="auto">
                            {name}
                          </span>
                        ) : (
                          <span
                            className="signature-font text-base text-ink-faint opacity-40"
                            dir="auto"
                          >
                            {copy.signaturePlaceholder}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-12 space-y-4 border-t border-hairline pt-6">
                  <div className="legal-stamp">
                    <span dir="auto">{stampText}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-4 text-center text-[11px] italic text-ink-faint" dir="auto">
              {copy.identityNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
