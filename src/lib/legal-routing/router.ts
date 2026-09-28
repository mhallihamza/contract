import { selectApplicableRules } from "./evaluator";
import { createAssembler } from "./router-parts";
import { harmonizeFlags, mergeMatchedRules, ROUTE_RESTRICTIVENESS } from "./route-merge";
import {
  ROUTE_REASON,
  type RoutingDecisionResult,
  type RoutingInput,
} from "./types";

/**
 * Deterministic router (§10, §39).
 *
 * 1. Requirements only ever strengthen: the most restrictive verified rule wins.
 * 2. LAWYER_SIGNATURE_REQUIRED comes only from a rule that declares it.
 * 3. Without a verified rule the engine refuses to guess and a human takes over.
 */
export const PRIMARY_JURISDICTION = "MA";

export function decideRoute(input: RoutingInput): RoutingDecisionResult {
  const now = input.evaluatedAt ?? new Date();
  const selection = selectApplicableRules(input);
  const { assemble, undetermined } = createAssembler(input, now);
  const matchedRuleIds = selection.matched.map((evaluation) => evaluation.ruleId);
  const matchedRules = input.rules.filter((rule) => matchedRuleIds.includes(rule.id));

  // 1 — Jurisdiction coverage.
  if (input.jurisdiction !== PRIMARY_JURISDICTION) {
    return assemble({
      route: "UNSUPPORTED",
      lawyerReviewRequirement: "OPTIONAL",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      specialistRequired: true,
      specialistType: "LOCAL_COUNSEL",
      writtenContractRequired: false,
      manualReviewRequired: true,
      reasonCodes: [ROUTE_REASON.jurisdictionUnsupported],
      matchedRuleIds: [],
      legalSourceIds: [],
      missingRuleContext: [`Règles configurées uniquement pour la juridiction ${PRIMARY_JURISDICTION}.`],
    });
  }

  // 2 — No contract type: the intent could not be mapped, a human decides.
  if (!input.contractType) {
    return undetermined([ROUTE_REASON.contractTypeUnknown]);
  }

  // 3 — No verified rule matched: never invent a route (§39, §66).
  if (selection.matched.length === 0) {
    const pending = selection.excluded.some(
      (evaluation) =>
        evaluation.exclusion === "RULE_NOT_VERIFIED" ||
        evaluation.exclusion === "LEGAL_SOURCE_NOT_VERIFIED" ||
        evaluation.exclusion === "LEGAL_SOURCE_MISSING",
    );
    if (pending || selection.notMatched.length > 0) {
      return undetermined(pending ? [ROUTE_REASON.rulesPendingVerification] : []);
    }
    return assemble({
      route: "UNSUPPORTED",
      lawyerReviewRequirement: "OPTIONAL",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      specialistRequired: false,
      specialistType: null,
      writtenContractRequired: false,
      manualReviewRequired: true,
      reasonCodes: [ROUTE_REASON.noVerifiedRule],
      matchedRuleIds: [],
      legalSourceIds: [],
    });
  }

  // 4 — Merge the matched rules; the most restrictive verified outcome wins.
  const merged = harmonizeFlags(mergeMatchedRules(matchedRules));

  // A category that is not offered online cannot produce a self-service outcome.
  if (
    !input.contractType.active &&
    ROUTE_RESTRICTIVENESS[merged.route] < ROUTE_RESTRICTIVENESS.SPECIALIST_REQUIRED
  ) {
    return assemble({
      ...merged,
      route: "UNSUPPORTED",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      manualReviewRequired: true,
      reasonCodes: [...merged.reasonCodes, ROUTE_REASON.contractTypeNotOffered],
    });
  }

  return assemble(merged);
}
