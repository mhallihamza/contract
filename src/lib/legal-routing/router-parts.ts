import { describeExclusions, selectApplicableRules, type RuleSelection } from "./evaluator";
import { buildReason } from "./reasons";
import {
  ROUTE_REASON,
  ROUTING_ENGINE_VERSION,
  type RoutingDecisionResult,
  type RoutingInput,
  type RoutingRuleDefinition,
  type RoutingRuleSnapshotEntry,
} from "./types";

/** Shared plumbing for decision assembly (snapshot, reasons, audit sentence). */

export function buildCandidates(
  selection: RuleSelection,
  rules: RoutingRuleDefinition[],
): RoutingRuleSnapshotEntry[] {
  return [...selection.matched, ...selection.notMatched, ...selection.excluded].map((evaluation) => ({
    id: evaluation.ruleId,
    code: evaluation.ruleCode,
    ruleKind: evaluation.ruleKind,
    route: evaluation.route,
    priority: evaluation.priority,
    matched: evaluation.matched,
    exclusion: evaluation.exclusion,
    legalSourceId: rules.find((rule) => rule.id === evaluation.ruleId)?.legalSource?.id ?? null,
  }));
}

export function legalSourceIdsOf(rules: RoutingRuleDefinition[]): string[] {
  return [...new Set(rules.map((rule) => rule.legalSource?.id).filter((id): id is string => Boolean(id)))];
}

export interface DecisionPartial {
  route: RoutingDecisionResult["route"];
  lawyerReviewRequirement: RoutingDecisionResult["lawyerReviewRequirement"];
  lawyerSignatureRequirement: RoutingDecisionResult["lawyerSignatureRequirement"];
  specialistRequired: boolean;
  specialistType: string | null;
  writtenContractRequired: boolean;
  manualReviewRequired: boolean;
  reasonCodes: string[];
  matchedRuleIds?: string[];
  legalSourceIds?: string[];
  missingRuleContext?: string[];
}

export interface Assembler {
  assemble: (partial: DecisionPartial) => RoutingDecisionResult;
  undetermined: (reasonCodes: string[], extraGaps?: string[]) => RoutingDecisionResult;
  gaps: string[];
  evaluations: RoutingDecisionResult["evaluations"];
}

export function createAssembler(input: RoutingInput, now: Date): Assembler {
  const selection = selectApplicableRules(input);
  const matchedRuleIds = selection.matched.map((evaluation) => evaluation.ruleId);
  const matchedRules = input.rules.filter((rule) => matchedRuleIds.includes(rule.id));
  const gaps = describeExclusions(selection);
  const candidates = buildCandidates(selection, input.rules);
  const evaluations = [...selection.matched, ...selection.notMatched, ...selection.excluded];

  const assemble = (partial: DecisionPartial): RoutingDecisionResult => {
    const ids = partial.matchedRuleIds ?? matchedRuleIds;
    return {
      ...partial,
      reason: buildReason(partial.reasonCodes, ids.length, gaps),
      matchedRuleIds: ids,
      legalSourceIds: partial.legalSourceIds ?? legalSourceIdsOf(matchedRules),
      missingRuleContext: partial.missingRuleContext ?? gaps,
      engineVersion: ROUTING_ENGINE_VERSION,
      ruleSnapshot: {
        engineVersion: ROUTING_ENGINE_VERSION,
        evaluatedAt: now.toISOString(),
        jurisdiction: input.jurisdiction,
        contractTypeCode: input.contractType?.code ?? null,
        intentCode: input.intentCode,
        caseFieldCount: Object.keys(input.caseData).length,
        matchedRuleIds: ids,
        candidates,
      },
      evaluations,
    };
  };

  const undetermined = (reasonCodes: string[], extraGaps: string[] = []): RoutingDecisionResult =>
    assemble({
      route: "ROUTING_UNDETERMINED",
      lawyerReviewRequirement: "OPTIONAL",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      specialistRequired: false,
      specialistType: null,
      writtenContractRequired: false,
      manualReviewRequired: true,
      reasonCodes: [...reasonCodes, ROUTE_REASON.manualReviewRequired],
      matchedRuleIds: [],
      legalSourceIds: [],
      missingRuleContext: [...gaps, ...extraGaps],
    });

  return { assemble, undetermined, gaps, evaluations };
}
