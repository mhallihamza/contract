import type { StructuredCase } from "@/lib/legal-routing/types";
import {
  FIELD_GROUP_LABEL,
  getFieldSpecs,
  type FieldGroup,
  type FieldSpec,
} from "@/lib/contracts/field-catalog";

/**
 * Dynamic question engine (§41).
 *
 * Questions come from three deterministic sources:
 *   1. the fields the contract type declares as required;
 *   2. the fields referenced by the conditions of the rules that apply;
 *   3. nothing else — the model may suggest clarifications, but it can never
 *      invent the questionnaire.
 */

export const QUESTION_GROUP_ORDER: FieldGroup[] = [
  "context",
  "property",
  "vehicle",
  "service",
  "confidentiality",
  "terms",
  "financial",
  "employment",
];

export interface QuestionSection {
  group: FieldGroup;
  label: { fr: string; ar: string };
  specs: FieldSpec[];
}

export interface QuestionSet {
  sections: QuestionSection[];
  /** Keys the client still has to answer. */
  missingKeys: string[];
  /** Every key the questionnaire covers. */
  coveredKeys: string[];
  requiredKeys: string[];
}

export interface QuestionInput {
  contractTypeCode: string;
  /** ContractType.requiredFields (admin-editable). */
  contractTypeRequiredFields?: string[];
  /** Field keys used by the conditions of applicable routing rules. */
  ruleFieldKeys?: string[];
  caseData: StructuredCase;
}

export function buildQuestionSet(input: QuestionInput): QuestionSet {
  const specs = getFieldSpecs(input.contractTypeCode);
  const requiredKeys = new Set<string>(input.contractTypeRequiredFields ?? []);
  const ruleKeys = new Set<string>(input.ruleFieldKeys ?? []);

  const covered = specs.filter(
    (spec) =>
      spec.required ||
      requiredKeys.has(spec.key) ||
      ruleKeys.has(spec.key) ||
      input.caseData[spec.key] !== undefined,
  );

  const coveredKeys = covered.map((spec) => spec.key);
  const requiredSpecs = covered.filter(
    (spec) => spec.required || requiredKeys.has(spec.key) || ruleKeys.has(spec.key),
  );

  const missingKeys = requiredSpecs
    .filter((spec) => {
      const value = input.caseData[spec.key];
      return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    })
    .map((spec) => spec.key);

  const sections: QuestionSection[] = [];
  for (const group of QUESTION_GROUP_ORDER) {
    const groupSpecs = covered.filter((spec) => spec.group === group);
    if (groupSpecs.length === 0) continue;
    sections.push({ group, label: FIELD_GROUP_LABEL[group], specs: groupSpecs });
  }

  return { sections, missingKeys, coveredKeys, requiredKeys: requiredSpecs.map((spec) => spec.key) };
}

/** Field keys referenced by the conditions of a set of rules. */
export function collectRuleFieldKeys(
  rules: { conditions: { field: string }[] }[],
): string[] {
  const keys = new Set<string>();
  for (const rule of rules) {
    for (const condition of rule.conditions) keys.add(condition.field);
  }
  return [...keys];
}

/** Remaining questions for a contract, used by the wizard progress indicator. */
export function remainingQuestionCount(set: QuestionSet): number {
  return set.missingKeys.length;
}
