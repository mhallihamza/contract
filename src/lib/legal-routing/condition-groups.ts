import { evaluateCondition } from "./conditions";
import type { RuleConditionDefinition, StructuredCase } from "./types";

export interface ConditionGroupEvaluation {
  groupIndex: number;
  passed: boolean;
  details: string[];
  failed: string[];
}

export interface ConditionSetEvaluation {
  /** A rule without conditions applies to every case within its scope. */
  hasConditions: boolean;
  matched: boolean;
  groups: ConditionGroupEvaluation[];
  failedConditions: string[];
  matchedGroups: number[];
}

/**
 * Conditions of the same group are AND-ed; groups are OR-ed.
 * Example: (duration >= 30 AND residential) OR (duration >= 90) — two groups.
 */
export function evaluateConditions(
  conditions: RuleConditionDefinition[],
  caseData: StructuredCase,
): ConditionSetEvaluation {
  if (conditions.length === 0) {
    return { hasConditions: false, matched: true, groups: [], failedConditions: [], matchedGroups: [] };
  }

  const grouped = new Map<number, RuleConditionDefinition[]>();
  for (const condition of conditions) {
    const bucket = grouped.get(condition.groupIndex);
    if (bucket) bucket.push(condition);
    else grouped.set(condition.groupIndex, [condition]);
  }

  const groups: ConditionGroupEvaluation[] = [];
  const failedConditions: string[] = [];
  const matchedGroups: number[] = [];

  for (const [groupIndex, groupConditions] of [...grouped.entries()].sort((a, b) => a[0] - b[0])) {
    const details: string[] = [];
    const failed: string[] = [];
    for (const condition of groupConditions) {
      const result = evaluateCondition(condition, caseData);
      details.push(result.detail);
      if (!result.passed) failed.push(condition.label ?? `${condition.field} ${condition.operator}`);
    }
    const passed = failed.length === 0;
    if (passed) matchedGroups.push(groupIndex);
    else failedConditions.push(...failed);
    groups.push({ groupIndex, passed, details, failed });
  }

  return {
    hasConditions: true,
    matched: groups.some((group) => group.passed),
    groups,
    failedConditions,
    matchedGroups,
  };
}
