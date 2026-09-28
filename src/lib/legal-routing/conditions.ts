import type { CaseValue, RuleConditionDefinition, StructuredCase } from "./types";

/**
 * Condition evaluation (§11).
 *
 * Deterministic and deliberately conservative: a condition on a value that is
 * not present in the structured case does NOT pass. Missing data therefore
 * never escalates or de-escalates a routing outcome by accident.
 */

export function readPath(caseData: StructuredCase, field: string): CaseValue {
  if (field in caseData) return caseData[field];
  if (!field.includes(".")) return undefined;
  let cursor: unknown = caseData;
  for (const segment of field.split(".")) {
    if (cursor && typeof cursor === "object" && segment in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return cursor as CaseValue;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return null;
}

function asComparable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "boolean" || typeof value === "number") return String(value).toLowerCase();
  return null;
}

export function isEmptyValue(value: CaseValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export interface ConditionEvaluation {
  passed: boolean;
  /** Explanation shown in the admin rule inspector. */
  detail: string;
}

export function evaluateCondition(
  condition: RuleConditionDefinition,
  caseData: StructuredCase,
): ConditionEvaluation {
  const actual = readPath(caseData, condition.field);
  const { operator } = condition;
  const label = condition.label ?? `${condition.field} ${operator}`;

  if (operator === "EXISTS") {
    const passed = !isEmptyValue(actual);
    return { passed, detail: `${label}: ${passed ? "présent" : "absent"}` };
  }
  if (operator === "NOT_EXISTS") {
    const passed = isEmptyValue(actual);
    return { passed, detail: `${label}: ${passed ? "absent" : "présent"}` };
  }

  if (isEmptyValue(actual)) {
    return { passed: false, detail: `${label}: valeur absente (condition non satisfaite)` };
  }

  switch (operator) {
    case "EQUALS":
    case "NOT_EQUALS": {
      const expected = asComparable(condition.valueText ?? condition.valueNumber ?? condition.valueBoolean);
      const found = asComparable(actual);
      const equal = expected !== null && found !== null && expected === found;
      const passed = operator === "EQUALS" ? equal : !equal;
      return { passed, detail: `${label}: attendu ${String(expected)}, trouvé ${String(found)}` };
    }
    case "IN":
    case "NOT_IN": {
      const list = (condition.valueList ?? []).map((entry) => entry.trim().toLowerCase());
      const found = asComparable(actual);
      const included = found !== null && list.includes(found);
      const passed = operator === "IN" ? included : !included;
      return { passed, detail: `${label}: ${String(found)} ${included ? "∈" : "∉"} [${list.join(", ")}]` };
    }
    case "GREATER_THAN":
    case "GREATER_THAN_OR_EQUAL":
    case "LESS_THAN":
    case "LESS_THAN_OR_EQUAL": {
      const left = asNumber(actual);
      const right = asNumber(condition.valueNumber ?? condition.valueText);
      if (left === null || right === null) {
        return { passed: false, detail: `${label}: comparaison numérique impossible` };
      }
      const passed =
        operator === "GREATER_THAN"
          ? left > right
          : operator === "GREATER_THAN_OR_EQUAL"
            ? left >= right
            : operator === "LESS_THAN"
              ? left < right
              : left <= right;
      return { passed, detail: `${label}: ${left} vs ${right} → ${passed ? "vrai" : "faux"}` };
    }
    default:
      return { passed: false, detail: `${label}: opérateur non pris en charge` };
  }
}
