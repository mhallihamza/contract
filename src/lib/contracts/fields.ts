import type { ContractField, FieldSource, FieldType, Prisma } from "@prisma/client";
import type { CaseValue, StructuredCase } from "@/lib/legal-routing/types";
import type { FieldSpec } from "@/lib/contracts/field-catalog";

/**
 * Structured case data (§57, §58).
 *
 * The contract's typed rows — not the chat transcript — are the source of truth
 * used by routing, questions, templates, generation and the lawyer package.
 */

export type ContractFieldRow = ContractField;

export function fieldToCaseValue(
  row: Pick<ContractField, "fieldType" | "valueText" | "valueNumber" | "valueDate" | "valueBoolean" | "valueList">,
): CaseValue {
  switch (row.fieldType) {
    case "NUMBER":
      return row.valueNumber === null ? undefined : Number(row.valueNumber);
    case "DATE":
      return row.valueDate ? row.valueDate.toISOString().slice(0, 10) : undefined;
    case "BOOLEAN":
      return row.valueBoolean ?? undefined;
    case "LIST":
      return row.valueList.length > 0 ? row.valueList : undefined;
    default:
      return row.valueText ?? undefined;
  }
}

export function rowsToStructuredCase(rows: ContractFieldRow[]): StructuredCase {
  const data: StructuredCase = {};
  for (const row of rows) {
    const value = fieldToCaseValue(row);
    if (value !== undefined && value !== null && value !== "") data[row.key] = value;
  }
  return data;
}

export interface NormalizedFieldValue {
  valueText: string | null;
  valueNumber: number | null;
  valueDate: Date | null;
  valueBoolean: boolean | null;
  valueList: string[];
}

/** Converts an untrusted form value into the typed columns of ContractField. */
export function normalizeFieldValue(fieldType: FieldType, raw: unknown): NormalizedFieldValue {
  const empty: NormalizedFieldValue = {
    valueText: null,
    valueNumber: null,
    valueDate: null,
    valueBoolean: null,
    valueList: [],
  };
  if (raw === undefined || raw === null || raw === "") return empty;

  switch (fieldType) {
    case "NUMBER": {
      const numeric = typeof raw === "number" ? raw : Number(String(raw).replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(numeric) ? { ...empty, valueNumber: numeric } : empty;
    }
    case "DATE": {
      const parsed = raw instanceof Date ? raw : new Date(String(raw));
      return Number.isNaN(parsed.getTime()) ? empty : { ...empty, valueDate: parsed };
    }
    case "BOOLEAN": {
      const truthy = raw === true || raw === "true" || raw === "on" || raw === "1" || raw === 1;
      return { ...empty, valueBoolean: truthy };
    }
    case "LIST": {
      const list = Array.isArray(raw) ? raw.map(String) : String(raw).split(",").map((item) => item.trim());
      return { ...empty, valueList: list.filter(Boolean) };
    }
    default:
      return { ...empty, valueText: String(raw).trim() };
  }
}

export function toFieldData(
  contractId: string,
  spec: FieldSpec,
  raw: unknown,
  source: FieldSource = "CLIENT_ANSWER",
): Prisma.ContractFieldUncheckedCreateInput {
  const normalized = normalizeFieldValue(spec.type, raw);
  return {
    contractId,
    key: spec.key,
    labelFr: spec.labelFr,
    labelAr: spec.labelAr,
    fieldType: spec.type,
    required: spec.required,
    source,
    ...normalized,
  };
}

/** Human-readable rendering of a fact, used in summaries and the lawyer package. */
export function formatCaseValue(value: CaseValue, locale: "fr" | "ar" = "fr"): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") {
    return value ? (locale === "ar" ? "نعم" : "Oui") : locale === "ar" ? "لا" : "Non";
  }
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "number") return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA").format(value);
  return String(value);
}
