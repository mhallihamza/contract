import type {
  ConditionOperator,
  RequirementLevel,
  RoutingRoute,
  RuleKind,
  RuleStatus,
  SignatureRequirement,
  VerificationStatus,
} from "@prisma/client";

/**
 * Legal routing engine — contract of record (§10).
 *
 * The engine is a pure function. The AI may propose an intent; only this module
 * decides the legal path, and only from rules that are configured, verified and
 * in force. That is what makes the outcome auditable and non-hallucinable.
 */
export const ROUTING_ENGINE_VERSION = "routing-engine/1.0.0";

export type CaseValue = string | number | boolean | string[] | null | undefined;

/** Structured legal facts (§58) — the single source of truth for routing. */
export interface StructuredCase {
  [key: string]: CaseValue;
}

export interface RuleConditionDefinition {
  id?: string;
  field: string;
  operator: ConditionOperator;
  valueText?: string | null;
  valueNumber?: number | string | null;
  valueBoolean?: boolean | null;
  valueList?: string[];
  /** Conditions AND inside a group; the rule matches when one group passes. */
  groupIndex: number;
  label?: string | null;
}

export interface RuleLegalSourceRef {
  id: string;
  code: string;
  title: string;
  lawNumber?: string | null;
  article?: string | null;
  officialUrl?: string | null;
  verificationStatus: VerificationStatus;
  effectiveDate?: Date | null;
  expiryDate?: Date | null;
}

export interface RoutingRuleDefinition {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  ruleKind: RuleKind;
  status: RuleStatus;
  active: boolean;
  jurisdiction: string;
  contractTypeId: string | null;
  scope?: string | null;
  route: RoutingRoute;
  lawyerReview: RequirementLevel;
  lawyerSignature: SignatureRequirement;
  specialistRequired: boolean;
  specialistType?: string | null;
  writtenContractRequired: boolean;
  manualReviewRequired: boolean;
  priority: number;
  reasonCode: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  article?: string | null;
  internalPolicyRef?: string | null;
  legalSource?: RuleLegalSourceRef | null;
  conditions: RuleConditionDefinition[];
}

export interface RoutingInput {
  jurisdiction: string;
  contractType: {
    id: string;
    code: string;
    active: boolean;
    nameFr?: string;
    nameAr?: string;
  } | null;
  intentCode: string | null;
  caseData: StructuredCase;
  rules: RoutingRuleDefinition[];
  evaluatedAt?: Date;
}

export type RuleExclusionReason =
  | "RULE_INACTIVE"
  | "RULE_NOT_VERIFIED"
  | "RULE_NOT_YET_EFFECTIVE"
  | "RULE_EXPIRED"
  | "JURISDICTION_MISMATCH"
  | "CONTRACT_TYPE_MISMATCH"
  | "LEGAL_SOURCE_MISSING"
  | "LEGAL_SOURCE_NOT_VERIFIED"
  | "LEGAL_SOURCE_EXPIRED"
  | "CONDITIONS_NOT_MET";

export interface RuleEvaluation {
  ruleId: string;
  ruleCode: string;
  title: string;
  ruleKind: RuleKind;
  route: RoutingRoute;
  priority: number;
  eligible: boolean;
  matched: boolean;
  exclusion?: RuleExclusionReason;
  /** Human-readable explanation used by the admin UI. */
  explanation: string;
  failedConditions: string[];
  matchedGroups: number[];
}

/** Machine-readable reasons attached to every decision. */
export const ROUTE_REASON = {
  jurisdictionUnsupported: "JURISDICTION_UNSUPPORTED",
  contractTypeUnknown: "CONTRACT_TYPE_UNKNOWN",
  contractTypeNotOffered: "CONTRACT_TYPE_NOT_OFFERED",
  noVerifiedRule: "NO_VERIFIED_RULE",
  rulesPendingVerification: "RULES_PENDING_VERIFICATION",
  selfService: "POLICY_SELF_SERVICE",
  lawyerOptional: "POLICY_LAWYER_OPTIONAL",
  lawyerRequired: "POLICY_LAWYER_REQUIRED",
  lawyerSignatureRequired: "POLICY_LAWYER_SIGNATURE_REQUIRED",
  specialistRequired: "POLICY_SPECIALIST_REQUIRED",
  legalRequirementApplied: "LEGAL_REQUIREMENT_APPLIED",
  writtenContractRequired: "WRITTEN_CONTRACT_REQUIRED",
  manualReviewRequired: "MANUAL_REVIEW_REQUIRED",
  undetermined: "ROUTING_UNDETERMINED",
} as const;

export type RouteReasonCode = (typeof ROUTE_REASON)[keyof typeof ROUTE_REASON] | string;

export interface RoutingRuleSnapshotEntry {
  id: string;
  code: string;
  ruleKind: RuleKind;
  route: RoutingRoute;
  priority: number;
  matched: boolean;
  exclusion?: RuleExclusionReason;
  legalSourceId: string | null;
}

export interface RoutingRuleSnapshot {
  engineVersion: string;
  evaluatedAt: string;
  jurisdiction: string;
  contractTypeCode: string | null;
  intentCode: string | null;
  caseFieldCount: number;
  matchedRuleIds: string[];
  candidates: RoutingRuleSnapshotEntry[];
}

export interface RoutingDecisionResult {
  route: RoutingRoute;
  lawyerReviewRequirement: RequirementLevel;
  lawyerSignatureRequirement: SignatureRequirement;
  specialistRequired: boolean;
  specialistType: string | null;
  writtenContractRequired: boolean;
  manualReviewRequired: boolean;
  reasonCodes: RouteReasonCode[];
  /** Audit sentence (French) stored with the decision. Localised copy for the
   *  client is rendered from `reasonCodes` + the UI dictionary. */
  reason: string;
  matchedRuleIds: string[];
  legalSourceIds: string[];
  missingRuleContext: string[];
  engineVersion: string;
  ruleSnapshot: RoutingRuleSnapshot;
  evaluations: RuleEvaluation[];
}
