import type { RequirementLevel, RoutingRoute, SignatureRequirement } from "@prisma/client";
import { ROUTE_REASON, type RoutingRuleDefinition } from "./types";

/**
 * Merging several verified rules into one coherent outcome.
 *
 * Invariants (§3, §10, §18, §21):
 *  • requirements only ever strengthen — a rule can never switch off a
 *    requirement declared by another rule;
 *  • SPECIALIST_REQUIRED wins over lawyer routes, and lawyer signature wins over
 *    a plain lawyer review;
 *  • a signature requirement can only come from a rule that says so explicitly.
 */

export const ROUTE_RESTRICTIVENESS: Record<RoutingRoute, number> = {
  SELF_SERVICE: 0,
  LAWYER_OPTIONAL: 1,
  LAWYER_REQUIRED: 2,
  SPECIALIST_REQUIRED: 3,
  LAWYER_SIGNATURE_REQUIRED: 4,
  ROUTING_UNDETERMINED: 5,
  UNSUPPORTED: 6,
};

export const REQUIREMENT_RANK: Record<RequirementLevel, number> = {
  NOT_REQUIRED: 0,
  OPTIONAL: 1,
  REQUIRED: 2,
};

export function mostRestrictive(routes: RoutingRoute[]): RoutingRoute {
  return routes.reduce<RoutingRoute>(
    (acc, route) => (ROUTE_RESTRICTIVENESS[route] > ROUTE_RESTRICTIVENESS[acc] ? route : acc),
    "SELF_SERVICE",
  );
}

export function maxRequirement(values: RequirementLevel[]): RequirementLevel {
  return values.reduce<RequirementLevel>(
    (acc, value) => (REQUIREMENT_RANK[value] > REQUIREMENT_RANK[acc] ? value : acc),
    "NOT_REQUIRED",
  );
}

export interface MergedOutcome {
  route: RoutingRoute;
  lawyerReviewRequirement: RequirementLevel;
  lawyerSignatureRequirement: SignatureRequirement;
  specialistRequired: boolean;
  specialistType: string | null;
  writtenContractRequired: boolean;
  manualReviewRequired: boolean;
  reasonCodes: string[];
}

export function mergeMatchedRules(matchedRules: RoutingRuleDefinition[]): MergedOutcome {
  const lawyerReview = maxRequirement(matchedRules.map((rule) => rule.lawyerReview));
  const signatureDeclared = matchedRules.some((rule) => rule.lawyerSignature === "REQUIRED");
  const specialistRequired = matchedRules.some((rule) => rule.specialistRequired);
  const specialistType = matchedRules.find((rule) => rule.specialistType)?.specialistType ?? null;
  const writtenContractRequired = matchedRules.some((rule) => rule.writtenContractRequired);
  const manualReviewRequired = matchedRules.some((rule) => rule.manualReviewRequired);

  const derived: RoutingRoute = specialistRequired
    ? "SPECIALIST_REQUIRED"
    : signatureDeclared
      ? "LAWYER_SIGNATURE_REQUIRED"
      : lawyerReview === "REQUIRED"
        ? "LAWYER_REQUIRED"
        : lawyerReview === "OPTIONAL"
          ? "LAWYER_OPTIONAL"
          : "SELF_SERVICE";

  const declared = matchedRules.map((rule) => rule.route);
  const route = mostRestrictive([derived, ...declared]);

  const reasonCodes: string[] = matchedRules.map((rule) => rule.reasonCode);
  if (matchedRules.some((rule) => rule.ruleKind === "LEGAL_REQUIREMENT")) {
    reasonCodes.push(ROUTE_REASON.legalRequirementApplied);
  }
  if (writtenContractRequired) reasonCodes.push(ROUTE_REASON.writtenContractRequired);
  if (manualReviewRequired) reasonCodes.push(ROUTE_REASON.manualReviewRequired);

  return {
    route,
    lawyerReviewRequirement: lawyerReview,
    lawyerSignatureRequirement: signatureDeclared ? "REQUIRED" : "NOT_REQUIRED",
    specialistRequired,
    specialistType,
    writtenContractRequired,
    manualReviewRequired,
    reasonCodes,
  };
}

/**
 * Adjusts the flags so the state exposed to the rest of the application is
 * always coherent with the final route.
 */
export function harmonizeFlags(outcome: MergedOutcome): MergedOutcome {
  const next = { ...outcome };
  switch (outcome.route) {
    case "LAWYER_SIGNATURE_REQUIRED":
      next.lawyerReviewRequirement = "REQUIRED";
      next.lawyerSignatureRequirement = "REQUIRED";
      break;
    case "LAWYER_REQUIRED":
      next.lawyerReviewRequirement = "REQUIRED";
      next.lawyerSignatureRequirement = "NOT_REQUIRED";
      break;
    case "LAWYER_OPTIONAL":
      next.lawyerReviewRequirement =
        next.lawyerReviewRequirement === "NOT_REQUIRED" ? "OPTIONAL" : next.lawyerReviewRequirement;
      next.lawyerSignatureRequirement = "NOT_REQUIRED";
      break;
    case "SELF_SERVICE":
      next.lawyerReviewRequirement = "NOT_REQUIRED";
      next.lawyerSignatureRequirement = "NOT_REQUIRED";
      break;
    case "UNSUPPORTED":
    case "ROUTING_UNDETERMINED":
      next.manualReviewRequired = true;
      next.lawyerSignatureRequirement = "NOT_REQUIRED";
      break;
    default:
      break;
  }
  return next;
}
