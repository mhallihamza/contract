import { evaluateConditions } from "./condition-groups";
import type { RoutingInput, RoutingRuleDefinition, RuleEvaluation, RuleExclusionReason } from "./types";

/**
 * Rule eligibility (§11, §34).
 *
 * A rule may only influence a routing decision when it is active, VERIFIED and
 * inside its effective window. A LEGAL_REQUIREMENT additionally needs a source
 * that is itself VERIFIED: the platform never asserts a legal obligation from
 * an unverified note (§39, §55, §66).
 */

function withinWindow(rule: RoutingRuleDefinition, now: Date): RuleExclusionReason | null {
  if (rule.effectiveFrom.getTime() > now.getTime()) return "RULE_NOT_YET_EFFECTIVE";
  if (rule.effectiveTo && rule.effectiveTo.getTime() < now.getTime()) return "RULE_EXPIRED";
  return null;
}

function sourceProblem(rule: RoutingRuleDefinition, now: Date): RuleExclusionReason | null {
  if (rule.ruleKind !== "LEGAL_REQUIREMENT") return null;
  if (!rule.legalSource) return "LEGAL_SOURCE_MISSING";
  if (rule.legalSource.verificationStatus !== "VERIFIED") return "LEGAL_SOURCE_NOT_VERIFIED";
  if (rule.legalSource.expiryDate && rule.legalSource.expiryDate.getTime() < now.getTime()) {
    return "LEGAL_SOURCE_EXPIRED";
  }
  return null;
}

const EXCLUSION_TEXT: Record<RuleExclusionReason, string> = {
  RULE_INACTIVE: "règle désactivée",
  RULE_NOT_VERIFIED: "règle non vérifiée",
  RULE_NOT_YET_EFFECTIVE: "règle pas encore en vigueur",
  RULE_EXPIRED: "règle expirée",
  JURISDICTION_MISMATCH: "juridiction différente",
  CONTRACT_TYPE_MISMATCH: "type de document différent",
  LEGAL_SOURCE_MISSING: "exigence légale sans source",
  LEGAL_SOURCE_NOT_VERIFIED: "source juridique non vérifiée",
  LEGAL_SOURCE_EXPIRED: "source juridique expirée",
  CONDITIONS_NOT_MET: "conditions non satisfaites",
};

export function evaluateRule(rule: RoutingRuleDefinition, input: RoutingInput, now: Date): RuleEvaluation {
  const base = {
    ruleId: rule.id,
    ruleCode: rule.code,
    title: rule.title,
    ruleKind: rule.ruleKind,
    route: rule.route,
    priority: rule.priority,
  };

  if (!rule.active) {
    return { ...base, eligible: false, matched: false, exclusion: "RULE_INACTIVE", explanation: EXCLUSION_TEXT.RULE_INACTIVE, failedConditions: [], matchedGroups: [] };
  }
  if (rule.status !== "VERIFIED") {
    return { ...base, eligible: false, matched: false, exclusion: "RULE_NOT_VERIFIED", explanation: EXCLUSION_TEXT.RULE_NOT_VERIFIED, failedConditions: [], matchedGroups: [] };
  }

  const windowIssue = withinWindow(rule, now);
  if (windowIssue) {
    return { ...base, eligible: false, matched: false, exclusion: windowIssue, explanation: EXCLUSION_TEXT[windowIssue], failedConditions: [], matchedGroups: [] };
  }
  if (rule.jurisdiction !== input.jurisdiction) {
    return { ...base, eligible: false, matched: false, exclusion: "JURISDICTION_MISMATCH", explanation: EXCLUSION_TEXT.JURISDICTION_MISMATCH, failedConditions: [], matchedGroups: [] };
  }
  if (rule.contractTypeId && rule.contractTypeId !== (input.contractType?.id ?? null)) {
    return { ...base, eligible: false, matched: false, exclusion: "CONTRACT_TYPE_MISMATCH", explanation: EXCLUSION_TEXT.CONTRACT_TYPE_MISMATCH, failedConditions: [], matchedGroups: [] };
  }

  const problem = sourceProblem(rule, now);
  if (problem) {
    return { ...base, eligible: false, matched: false, exclusion: problem, explanation: EXCLUSION_TEXT[problem], failedConditions: [], matchedGroups: [] };
  }

  const conditions = evaluateConditions(rule.conditions, input.caseData);
  if (!conditions.matched) {
    return {
      ...base,
      eligible: true,
      matched: false,
      exclusion: "CONDITIONS_NOT_MET",
      explanation: EXCLUSION_TEXT.CONDITIONS_NOT_MET,
      failedConditions: conditions.failedConditions,
      matchedGroups: [],
    };
  }

  return {
    ...base,
    eligible: true,
    matched: true,
    explanation: conditions.hasConditions
      ? `conditions satisfaites (groupe ${conditions.matchedGroups.join(", ")})`
      : "règle applicable sans condition",
    failedConditions: [],
    matchedGroups: conditions.matchedGroups,
  };
}

export interface RuleSelection {
  matched: RuleEvaluation[];
  /** Eligible but conditions not met — informative only. */
  notMatched: RuleEvaluation[];
  /** Ineligible: cannot influence routing by construction. */
  excluded: RuleEvaluation[];
}

export function selectApplicableRules(input: RoutingInput): RuleSelection {
  const now = input.evaluatedAt ?? new Date();
  const matched: RuleEvaluation[] = [];
  const notMatched: RuleEvaluation[] = [];
  const excluded: RuleEvaluation[] = [];

  for (const rule of input.rules) {
    const evaluation = evaluateRule(rule, input, now);
    if (evaluation.matched) matched.push(evaluation);
    else if (evaluation.exclusion === "CONDITIONS_NOT_MET") notMatched.push(evaluation);
    else excluded.push(evaluation);
  }

  const byPriority = (a: RuleEvaluation, b: RuleEvaluation) => a.priority - b.priority || a.ruleCode.localeCompare(b.ruleCode);
  matched.sort(byPriority);
  notMatched.sort(byPriority);
  excluded.sort(byPriority);

  return { matched, notMatched, excluded };
}

/** Human-readable notes about rules that exist but cannot be used yet. */
export function describeExclusions(selection: RuleSelection): string[] {
  const notes: string[] = [];
  for (const evaluation of selection.excluded) {
    notes.push(`${evaluation.ruleCode} (${evaluation.title}) ignorée : ${evaluation.explanation}`);
  }
  for (const evaluation of selection.notMatched) {
    const failed = evaluation.failedConditions.length > 0 ? ` — ${evaluation.failedConditions.join("; ")}` : "";
    notes.push(`${evaluation.ruleCode} (${evaluation.title}) non applicable aux faits du dossier${failed}`);
  }
  return notes;
}
