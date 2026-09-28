import type { FieldType } from "@prisma/client";

/**
 * Field catalogue types (§41).
 *
 * Questions are generated from these specs + the fields referenced by routing
 * rules — never from free-form model output. Keys are stable because they are
 * also used in rule conditions and template variables.
 */

export interface FieldOption {
  value: string;
  fr: string;
  ar: string;
}

export type FieldGroup =
  | "context"
  | "property"
  | "terms"
  | "financial"
  | "service"
  | "confidentiality"
  | "vehicle"
  | "employment";

export interface FieldSpec {
  key: string;
  labelFr: string;
  labelAr: string;
  type: FieldType;
  required: boolean;
  group: FieldGroup;
  helpFr?: string;
  helpAr?: string;
  options?: FieldOption[];
  min?: number;
  max?: number;
}

export function f(
  key: string,
  labelFr: string,
  labelAr: string,
  type: FieldType = "TEXT",
  extra: Partial<FieldSpec> = {},
): FieldSpec {
  return { key, labelFr, labelAr, type, required: extra.required ?? true, group: extra.group ?? "terms", ...extra };
}

export function yesNo(
  key: string,
  labelFr: string,
  labelAr: string,
  group: FieldGroup,
  required = false,
): FieldSpec {
  return f(key, labelFr, labelAr, "BOOLEAN", { group, required });
}

export const FIELD_GROUP_LABEL: Record<FieldGroup, { fr: string; ar: string }> = {
  context: { fr: "Contexte", ar: "السياق" },
  property: { fr: "Bien concerné", ar: "المحل المعني" },
  terms: { fr: "Conditions", ar: "الشروط" },
  financial: { fr: "Conditions financières", ar: "الشروط المالية" },
  service: { fr: "Prestation", ar: "الخدمة" },
  confidentiality: { fr: "Confidentialité", ar: "السرية" },
  vehicle: { fr: "Véhicule", ar: "السيارة" },
  employment: { fr: "Emploi", ar: "الشغل" },
};
