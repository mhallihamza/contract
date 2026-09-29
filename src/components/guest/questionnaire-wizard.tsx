"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

/**
 * Guest questionnaire (§9, §36).
 *
 * Questions come from the server (field catalogue + rule dependencies); this
 * component only renders them and posts typed answers. Each step is an ordinary
 * form, so answers survive on mobile keyboards and the page stays usable without
 * client-side state machines. Everything is saved server-side before the next step
 * is shown, and the routing engine only runs at the end.
 */

export interface WizardField {
  key: string;
  labelFr: string;
  labelAr: string;
  type: string;
  required: boolean;
  helpFr?: string;
  helpAr?: string;
  options?: { value: string; fr: string; ar: string }[];
}

export interface WizardSection {
  group: string;
  labelFr: string;
  labelAr: string;
  fields: WizardField[];
}

export interface WizardPartyRole {
  role: string;
  labelFr: string;
  labelAr: string;
}

export interface WizardPartyDraft {
  role: string;
  partyType: "INDIVIDUAL" | "COMPANY";
  fullName: string;
  companyTaxId: string;
  address: string;
  city: string;
  email: string;
  phone: string;
}

export interface WizardLabels {
  step: string;
  title: string;
  questionsSubtitle: string;
  partiesSubtitle: string;
  you: string;
  partyName: string;
  partyTypeCompany: string;
  partyTypeIndividual: string;
  partyCompanyTaxId: string;
  partyAddress: string;
  partyCity: string;
  partyEmail: string;
  partyPhone: string;
  continue: string;
  back: string;
  saving: string;
  saved: string;
  validate: string;
  validating: string;
  missing: string;
  errorGeneric: string;
  expired: string;
  required: string;
  optional: string;
  reviewTitle: string;
  reviewSubtitle: string;
  reviewEmpty: string;
}

type StepKind = "questions" | "parties" | "review";

interface Step {
  kind: StepKind;
  label: string;
  section?: WizardSection;
}

function toAnswerValue(field: WizardField, raw: string): unknown {
  const value = raw.trim();
  if (value === "") return undefined;
  switch (field.type) {
    case "NUMBER":
      return Number(value.replace(",", "."));
    case "BOOLEAN":
      return value === "true";
    case "LIST":
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    default:
      return value;
  }
}

// (initialDraft helper removed: party defaults now come from the server-rendered values)

export function QuestionnaireWizard({
  token,
  locale,
  labels,
  sections,
  savedAnswers,
  roles,
  existingParties,
}: {
  token: string;
  locale: "fr" | "ar";
  labels: WizardLabels;
  sections: WizardSection[];
  savedAnswers: Record<string, unknown>;
  roles: WizardPartyRole[];
  existingParties: WizardPartyDraft[];
}) {
  const router = useRouter();

  const steps = useMemo<Step[]>(() => {
    const questionSteps: Step[] = sections.map((section) => ({
      kind: "questions",
      label: locale === "ar" ? section.labelAr : section.labelFr,
      section,
    }));
    return [
      ...questionSteps,
      { kind: "parties", label: locale === "ar" ? "الأطراف" : "Les parties" },
      { kind: "review", label: locale === "ar" ? "التحقق" : "Vérification" },
    ];
  }, [sections, locale]);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(savedAnswers);
  const [partiesSnapshot, setPartiesSnapshot] = useState<WizardPartyDraft[]>(existingParties);
  const [pending, setPending] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const percent = Math.round(((stepIndex + 1) / steps.length) * 100);

  async function post(action: string, body: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }> {
    try {
      const response = await fetch(`/api/guest/${token}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = (await response.json()) as { ok: boolean; data?: unknown; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error === "GUEST_SESSION_NOT_FOUND" ? labels.expired : labels.errorGeneric);
        return { ok: false, error: payload.error };
      }
      return { ok: true, data: payload.data };
    } catch {
      setError(labels.errorGeneric);
      return { ok: false };
    }
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  async function submitQuestionStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    const missing: string[] = [];

    for (const field of step.section?.fields ?? []) {
      const value = toAnswerValue(field, String(formData.get(field.key) ?? ""));
      if (value === undefined) {
        if (field.required) missing.push(locale === "ar" ? field.labelAr : field.labelFr);
        continue;
      }
      values[field.key] = value;
    }

    if (missing.length > 0) {
      setError(`${labels.missing} (${missing.join(", ")})`);
      return;
    }

    setPending(true);
    const result = await post("answers", { values });
    setPending(false);
    if (!result.ok) return;

    setAnswers((previous) => ({ ...previous, ...values }));
    flashSaved();
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  async function submitParties(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const drafts = roles
      .map((role) => ({
        role: role.role,
        partyType: (String(formData.get(`partyType-${role.role}`) ?? "INDIVIDUAL") === "COMPANY"
          ? "COMPANY"
          : "INDIVIDUAL") as "INDIVIDUAL" | "COMPANY",
        fullName: String(formData.get(`fullName-${role.role}`) ?? "").trim(),
        companyTaxId: String(formData.get(`companyTaxId-${role.role}`) ?? "").trim(),
        address: String(formData.get(`address-${role.role}`) ?? "").trim(),
        city: String(formData.get(`city-${role.role}`) ?? "").trim(),
        email: String(formData.get(`email-${role.role}`) ?? "").trim(),
        phone: String(formData.get(`phone-${role.role}`) ?? "").trim(),
      }))
      .filter((draft) => draft.fullName.length > 1);

    if (drafts.length < 2) {
      setError(labels.missing);
      return;
    }

    setPending(true);
    const result = await post("parties", {
      parties: drafts.map((draft) => ({
        role: draft.role,
        partyType: draft.partyType,
        fullName: draft.fullName,
        companyTaxId: draft.companyTaxId || null,
        address: draft.address || null,
        city: draft.city || null,
        email: draft.email || null,
        phone: draft.phone || null,
      })),
    });
    setPending(false);
    if (!result.ok) return;

    setPartiesSnapshot(drafts);
    flashSaved();
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  async function submitReview() {
    setError(null);
    setPending(true);
    const routing = await post("routing", {});
    setPending(false);
    if (!routing.ok) return;
    router.push(`/dossier/${token}`);
  }

  const stepLabel = labels.step
    .replace("{current}", String(stepIndex + 1))
    .replace("{total}", String(steps.length));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stepLabel}</span>
          <span className="font-medium text-foreground">{step.label}</span>
        </div>
        <Progress value={percent} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{step.label}</CardTitle>
          <CardDescription dir="auto">
            {step.kind === "questions"
              ? labels.questionsSubtitle
              : step.kind === "parties"
                ? labels.partiesSubtitle
                : labels.reviewSubtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {step.kind === "questions" ? (
            <form onSubmit={submitQuestionStep} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {(step.section?.fields ?? []).map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    locale={locale}
                    value={answers[field.key]}
                    labels={labels}
                  />
                ))}
              </div>

              <StepActions
                labels={labels}
                pending={pending}
                canGoBack={stepIndex > 0}
                onBack={() => setStepIndex((index) => Math.max(0, index - 1))}
              />
            </form>
          ) : step.kind === "parties" ? (
            <form onSubmit={submitParties} className="space-y-6">
              <div className="space-y-5">
                {roles.map((role) => {
                  const existing = existingParties.find((party) => party.role === role.role);
                  return (
                    <div key={role.role} className="space-y-3 rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium" dir="auto">
                          {locale === "ar" ? role.labelAr : role.labelFr}
                        </p>
                        <select
                          name={`partyType-${role.role}`}
                          defaultValue={existing?.partyType ?? "INDIVIDUAL"}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="INDIVIDUAL">{labels.partyTypeIndividual}</option>
                          <option value="COMPANY">{labels.partyTypeCompany}</option>
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            {labels.partyName} <span className="text-destructive">*</span>
                          </label>
                          <Input name={`fullName-${role.role}`} defaultValue={existing?.fullName ?? ""} dir="auto" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            {labels.partyCity}
                          </label>
                          <Input name={`city-${role.role}`} defaultValue={existing?.city ?? ""} dir="auto" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            {labels.partyAddress}
                          </label>
                          <Input name={`address-${role.role}`} defaultValue={existing?.address ?? ""} dir="auto" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <StepActions
                labels={labels}
                pending={pending}
                canGoBack={stepIndex > 0}
                onBack={() => setStepIndex((index) => Math.max(0, index - 1))}
              />
            </form>
          ) : (
            <ReviewStep
              labels={labels}
              locale={locale}
              sections={sections}
              answers={answers}
              parties={partiesSnapshot}
              roles={roles}
              pending={pending}
              onBack={() => setStepIndex((index) => Math.max(0, index - 1))}
              onSubmit={submitReview}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-xs">
        {savedFlash ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {labels.saved}
          </span>
        ) : null}
        {error ? (
          <span className="flex items-start gap-1 text-destructive" dir="auto">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** One question: the control follows the declared field type. */
function FieldControl({
  field,
  locale,
  value,
  labels,
}: {
  field: WizardField;
  locale: "fr" | "ar";
  value: unknown;
  labels: WizardLabels;
}) {
  const label = locale === "ar" ? field.labelAr : field.labelFr;
  const help = locale === "ar" ? field.helpAr : field.helpFr;
  const current = value === undefined || value === null ? "" : String(value);
  const wide = field.type === "TEXT" || field.type === "LIST";

  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor={`field-${field.key}`}>
        <span dir="auto">{label}</span>
        {field.required ? (
          <span className="text-destructive"> *</span>
        ) : (
          <span className="text-muted-foreground"> ({labels.optional})</span>
        )}
      </label>

      {field.type === "SELECT" && field.options ? (
        <select
          id={`field-${field.key}`}
          name={field.key}
          defaultValue={current}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">—</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {locale === "ar" ? option.ar : option.fr}
            </option>
          ))}
        </select>
      ) : field.type === "BOOLEAN" ? (
        <select
          id={`field-${field.key}`}
          name={field.key}
          defaultValue={current}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">—</option>
          <option value="true">{locale === "ar" ? "نعم" : "Oui"}</option>
          <option value="false">{locale === "ar" ? "لا" : "Non"}</option>
        </select>
      ) : wide ? (
        <Textarea id={`field-${field.key}`} name={field.key} defaultValue={current} rows={2} dir="auto" />
      ) : (
        <Input
          id={`field-${field.key}`}
          name={field.key}
          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
          defaultValue={current}
          dir={field.type === "NUMBER" || field.type === "DATE" ? "ltr" : "auto"}
        />
      )}

      {help ? (
        <p className="mt-1 text-[11px] text-muted-foreground" dir="auto">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Back / continue row shared by the question and party steps. */
function StepActions({
  labels,
  pending,
  canGoBack,
  onBack,
}: {
  labels: WizardLabels;
  pending: boolean;
  canGoBack: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={onBack} disabled={!canGoBack || pending}>
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {labels.back}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {pending ? labels.saving : labels.continue}
        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </Button>
    </div>
  );
}

/** Review step: what the client just answered, before the routing engine runs. */
function ReviewStep({
  labels,
  locale,
  sections,
  answers,
  parties,
  roles,
  pending,
  onBack,
  onSubmit,
}: {
  labels: WizardLabels;
  locale: "fr" | "ar";
  sections: WizardSection[];
  answers: Record<string, unknown>;
  parties: WizardPartyDraft[];
  roles: WizardPartyRole[];
  pending: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const answeredFields = sections.flatMap((section) =>
    section.fields.filter((field) => answers[field.key] !== undefined && answers[field.key] !== ""),
  );
  const namedParties = parties.filter((party) => party.fullName.trim().length > 0);

  return (
    <div className="space-y-5">
      <dl className="space-y-2 text-sm">
        {answeredFields.map((field) => (
          <div key={field.key} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-1">
            <dt className="text-muted-foreground" dir="auto">
              {locale === "ar" ? field.labelAr : field.labelFr}
            </dt>
            <dd className="font-medium" dir="auto">
              {formatAnswer(answers[field.key], field, locale)}
            </dd>
          </div>
        ))}

        {namedParties.map((party) => {
          const role = roles.find((candidate) => candidate.role === party.role);
          return (
            <div key={`party-${party.role}`} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-1">
              <dt className="text-muted-foreground" dir="auto">
                {role ? (locale === "ar" ? role.labelAr : role.labelFr) : party.role}
              </dt>
              <dd className="font-medium" dir="auto">
                {party.fullName}
              </dd>
            </div>
          );
        })}
      </dl>

      {answeredFields.length === 0 && namedParties.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.reviewEmpty}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {labels.back}
        </Button>
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? labels.validating : labels.validate}
        </Button>
      </div>
    </div>
  );
}

/** Human-readable answer for the review step. */
function formatAnswer(value: unknown, field: WizardField, locale: "fr" | "ar"): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") {
    return value ? (locale === "ar" ? "نعم" : "Oui") : locale === "ar" ? "لا" : "Non";
  }
  if (Array.isArray(value)) return value.join(", ");
  if (field.type === "SELECT" && field.options) {
    const option = field.options.find((candidate) => candidate.value === String(value));
    if (option) return locale === "ar" ? option.ar : option.fr;
  }
  return String(value);
}

