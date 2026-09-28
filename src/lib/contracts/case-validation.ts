import type { StructuredCase } from "@/lib/legal-routing/types";
import { getFieldSpecs, type FieldSpec } from "@/lib/contracts/field-catalog";

/**
 * Validation before generation (§16).
 *
 * A document is never produced while a mandatory fact is missing, invalid or
 * inconsistent.
 */

export interface CaseValidationResult {
  valid: boolean;
  missing: FieldSpec[];
  missingKeys: string[];
  invalid: { key: string; reason: string }[];
}

export function validateCase(
  contractTypeCode: string,
  caseData: StructuredCase,
  options: { requiredKeys?: string[] } = {},
): CaseValidationResult {
  const specs = getFieldSpecs(contractTypeCode);
  const requiredKeys = new Set(
    options.requiredKeys ?? specs.filter((spec) => spec.required).map((spec) => spec.key),
  );
  const missing: FieldSpec[] = [];
  const invalid: { key: string; reason: string }[] = [];
  const missingKeys: string[] = [];

  for (const spec of specs) {
    if (!requiredKeys.has(spec.key)) continue;
    const value = caseData[spec.key];
    const absent =
      value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (absent) {
      missing.push(spec);
      missingKeys.push(spec.key);
      continue;
    }
    if (spec.type === "NUMBER") {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) invalid.push({ key: spec.key, reason: "VALUE_NOT_NUMERIC" });
      else if (spec.min !== undefined && numeric < spec.min) invalid.push({ key: spec.key, reason: "VALUE_BELOW_MIN" });
      else if (spec.max !== undefined && numeric > spec.max) invalid.push({ key: spec.key, reason: "VALUE_ABOVE_MAX" });
    }
    if (spec.type === "DATE") {
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) invalid.push({ key: spec.key, reason: "VALUE_NOT_A_DATE" });
    }
    if (spec.options && spec.options.length > 0 && !spec.options.some((option) => option.value === String(value))) {
      invalid.push({ key: spec.key, reason: "VALUE_NOT_ALLOWED" });
    }
  }

  return { valid: missing.length === 0 && invalid.length === 0, missing, missingKeys, invalid };
}

/** Cross-field consistency checks (dates, amounts) applied before generation. */
export function validateCaseConsistency(contractTypeCode: string, caseData: StructuredCase): { errors: string[] } {
  const errors: string[] = [];
  const asDate = (key: string) => {
    const value = caseData[key];
    if (!value) return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const start = asDate("startDate") ?? asDate("contractStartDate") ?? asDate("saleDate");
  const end = asDate("endDate") ?? asDate("contractEndDate");
  if (start && end && end.getTime() <= start.getTime()) errors.push("END_BEFORE_START");

  if (contractTypeCode === "RESIDENTIAL_LEASE") {
    if (Number(caseData.durationMonths ?? 0) <= 0) errors.push("DURATION_INVALID");
    if (Number(caseData.rentAmountMad ?? 0) <= 0) errors.push("RENT_INVALID");
    if (Number(caseData.securityDepositMad ?? 0) < 0) errors.push("DEPOSIT_INVALID");
  }

  if (contractTypeCode === "FREELANCE_SERVICE" && Number(caseData.amountMad ?? 0) <= 0) {
    errors.push("AMOUNT_INVALID");
  }

  if (contractTypeCode === "VEHICLE_SALE" && Number(caseData.salePriceMad ?? 0) <= 0) {
    errors.push("PRICE_INVALID");
  }

  return { errors };
}

/** Parties are part of the mandatory facts for every generated contract. */
export function validateParties(parties: { role: string; fullName: string }[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (parties.length < 2) errors.push("PARTIES_TOO_FEW");
  const roles = new Set<string>();
  for (const party of parties) {
    if (!party.fullName?.trim()) errors.push("PARTY_NAME_MISSING");
    if (roles.has(party.role)) errors.push(`PARTY_ROLE_DUPLICATED:${party.role}`);
    roles.add(party.role);
  }
  return { valid: errors.length === 0, errors };
}
