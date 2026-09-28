"use client";

import { useActionState, useState } from "react";
import type { FieldType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { saveAnswersAction } from "@/app/app/actions";
import type { ActionState } from "@/lib/actions/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Dynamic questionnaire (§41).
 *
 * Questions come from the field catalogue (declared fields + rule dependencies);
 * this component only renders what it is given and serialises the answers as
 * typed JSON for the server action to normalise.
 */
export interface FieldInputSpec {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  value: unknown;
}

export interface FieldSection {
  group: string;
  label: string;
  fields: FieldInputSpec[];
}

export interface AnswersFormLabels {
  title: string;
  subtitle: string;
  requiredHint: string;
  save: string;
  saving: string;
  incomplete: string;
  saved: string;
  errorUnexpected: string;
  optionalLabel: string;
  yesLabel: string;
  noLabel: string;
}

function initialValue(spec: FieldInputSpec): string {
  const value = spec.value;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export function AnswersForm({
  contractId,
  sections,
  missingKeys,
  labels,
}: {
  contractId: string;
  sections: readonly FieldSection[];
  missingKeys: readonly string[];
  labels: AnswersFormLabels;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveAnswersAction, { ok: false });

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      sections.flatMap((section) => section.fields.map((field) => [field.key, initialValue(field)])),
    ),
  );

  const setValue = (key: string, value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  const serialize = () => {
    const payload: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const raw = values[field.key] ?? initialValue(field);
        if (raw === "") continue;
        switch (field.type) {
          case "NUMBER":
            payload[field.key] = Number(raw.replace(",", "."));
            break;
          case "BOOLEAN":
            payload[field.key] = raw === "true";
            break;
          case "LIST":
            payload[field.key] = raw
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
            break;
          default:
            payload[field.key] = raw;
        }
      }
    }
    return JSON.stringify(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription dir="auto">{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="contractId" value={contractId} />
          <input type="hidden" name="answers" value={serialize()} />

          <p className="text-xs text-muted-foreground">{labels.requiredHint}</p>

          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {labels.errorUnexpected}
            </p>
          ) : null}
          {state.ok ? (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              {state.missingFields && state.missingFields.length > 0
                ? `${labels.incomplete} (${state.missingFields.length})`
                : labels.saved}
            </p>
          ) : null}

          {sections.map((section) => (
            <fieldset key={section.group} className="space-y-4">
              <legend className="text-sm font-semibold">{section.label}</legend>
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? initialValue(field)}
                    missing={missingKeys.includes(field.key)}
                    labels={labels}
                    onChange={(value) => setValue(field.key, value)}
                  />
                ))}
              </div>
            </fieldset>
          ))}

          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? labels.saving : labels.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Single field renderer: SELECT, BOOLEAN, TEXT and scalars stay consistent. */
function FieldControl({
  field,
  value,
  missing,
  labels,
  onChange,
}: {
  field: FieldInputSpec;
  value: string;
  missing: boolean;
  labels: AnswersFormLabels;
  onChange: (value: string) => void;
}) {
  const inputId = `field-${field.key}`;

  return (
    <div className={field.type === "TEXT" ? "md:col-span-2" : undefined}>
      <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-muted-foreground">
        <span dir="auto">{field.label}</span>
        {field.required ? (
          <span className="text-destructive"> *</span>
        ) : (
          <span className="text-muted-foreground"> ({labels.optionalLabel})</span>
        )}
        {missing ? (
          <span className="ms-2 font-semibold text-destructive" title={labels.requiredHint}>
            •
          </span>
        ) : null}
      </label>

      {field.type === "SELECT" && field.options ? (
        <select
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">—</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "BOOLEAN" ? (
        <select
          id={inputId}
          value={value === "true" ? "true" : value === "false" ? "false" : ""}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">—</option>
          <option value="true">{labels.yesLabel}</option>
          <option value="false">{labels.noLabel}</option>
        </select>
      ) : field.type === "TEXT" || field.type === "LIST" ? (
        <Textarea
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          dir="auto"
          className="resize-none"
        />
      ) : (
        <Input
          id={inputId}
          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          dir={field.type === "DATE" || field.type === "NUMBER" ? "ltr" : "auto"}
        />
      )}

      {field.help ? (
        <p className="mt-1 text-[11px] text-muted-foreground" dir="auto">
          {field.help}
        </p>
      ) : null}
    </div>
  );
}
