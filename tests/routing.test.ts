import { describe, expect, it } from "vitest";
import type { RoutingRoute } from "@prisma/client";
import { decideRoute } from "@/lib/legal-routing/router";
import { lawyerRequirementForType } from "@/lib/contracts/route-reading";
import type { RoutingInput, RoutingRuleDefinition } from "@/lib/legal-routing/types";

/**
 * Routing invariants (§10, §11, §39).
 *
 * The fixtures mirror the seeded rules one-to-one: every seeded rule must
 * produce its intended route, the merge must never weaken a requirement, and
 * anything without a verified rule must fall to a human, never to a guess.
 * Real-estate stays pinned to the specialist (notary / agréé lawyer): the
 * platform never sells online what the law reserves to an authentic act.
 */

let id = 0;

function makeRule(overrides: Partial<RoutingRuleDefinition> & { code: string; route: RoutingRoute }): RoutingRuleDefinition {
  id += 1;
  return {
    id: `rule_${id}`,
    title: overrides.title ?? overrides.code,
    ruleKind: "PLATFORM_POLICY",
    status: "VERIFIED",
    active: true,
    jurisdiction: "MA",
    contractTypeId: null,
    scope: null,
    lawyerReview: "NOT_REQUIRED",
    lawyerSignature: "NOT_REQUIRED",
    specialistRequired: false,
    specialistType: null,
    writtenContractRequired: true,
    manualReviewRequired: false,
    priority: 100,
    reasonCode: "TEST",
    effectiveFrom: new Date("2020-01-01"),
    effectiveTo: null,
    article: null,
    internalPolicyRef: null,
    legalSource: null,
    conditions: [],
    ...overrides,
    code: overrides.code,
    route: overrides.route,
  };
}

function decide(rules: RoutingRuleDefinition[], caseData: RoutingInput["caseData"], activeType = true): RoutingRoute {
  return decideRoute({
    jurisdiction: "MA",
    contractType: { id: "type-1", code: "TEST_TYPE", active: activeType },
    intentCode: null,
    caseData,
    rules,
  }).route;
}

describe("seeded rules route as configured", () => {
  // Note on engine semantics (§10: requirements only ever strengthen): a rule
  // whose declared route is SELF_SERVICE but whose lawyer review is OPTIONAL
  // surfaces as LAWYER_OPTIONAL — the case can still finalize unassisted, the
  // engine only widens what is possible, never restricts below the rule.
  const leaseStandard = makeRule({
    code: "MA-LEASE-STANDARD-001",
    route: "SELF_SERVICE",
    lawyerReview: "OPTIONAL",
  });
  const leaseSelfOnly = makeRule({ code: "MA-LEASE-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "NOT_REQUIRED" });
  const leaseHighValue = makeRule({
    code: "MA-LEASE-HIGH-VALUE-002",
    route: "LAWYER_OPTIONAL",
    lawyerReview: "OPTIONAL",
    priority: 50,
    conditions: [{ field: "rentAmountMad", operator: "GREATER_THAN", valueNumber: 15000, groupIndex: 0 }],
  });
  const serviceStandard = makeRule({
    code: "MA-SERVICE-STANDARD-001",
    route: "SELF_SERVICE",
    lawyerReview: "OPTIONAL",
  });
  const serviceSelfOnly = makeRule({ code: "MA-SERVICE-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "NOT_REQUIRED" });
  const serviceIpHigh = makeRule({
    code: "MA-SERVICE-IP-HIGH-002",
    route: "LAWYER_REQUIRED",
    lawyerReview: "REQUIRED",
    priority: 30,
    conditions: [
      { field: "ipAssignment", operator: "EQUALS", valueBoolean: true, groupIndex: 0 },
      { field: "amountMad", operator: "GREATER_THAN", valueNumber: 60000, groupIndex: 0 },
    ],
  });
  const ndaStandard = makeRule({ code: "MA-NDA-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "OPTIONAL" });
  const ndaSelfOnly = makeRule({ code: "MA-NDA-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "NOT_REQUIRED" });
  const vehicleStandard = makeRule({ code: "MA-VEHICLE-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "OPTIONAL" });
  const vehicleSelfOnly = makeRule({ code: "MA-VEHICLE-STANDARD-001", route: "SELF_SERVICE", lawyerReview: "NOT_REQUIRED" });
  const employmentCdd = makeRule({
    code: "MA-EMPLOYMENT-CDD-001",
    route: "LAWYER_REQUIRED",
    lawyerReview: "REQUIRED",
    priority: 40,
  });

  it("residential lease: standard case never forces a lawyer", () => {
    // The seeded rule allows the optional review, so the route is the choice
    // branch; the checkout can still complete at the self-service price.
    expect(decide([leaseStandard], { rentAmountMad: 5000 })).toBe("LAWYER_OPTIONAL");
    // A stricter seeding (review not offered) keeps pure self-service.
    expect(decide([leaseSelfOnly], { rentAmountMad: 5000 })).toBe("SELF_SERVICE");
  });

  it("residential lease: a high rent makes the lawyer optional, never mandatory", () => {
    expect(decide([leaseStandard, leaseHighValue], { rentAmountMad: 20000 })).toBe("LAWYER_OPTIONAL");
  });

  it("freelance: IP assignment above 60 000 MAD requires a lawyer", () => {
    expect(decide([serviceStandard, serviceIpHigh], { ipAssignment: true, amountMad: 80000 })).toBe("LAWYER_REQUIRED");
  });

  it("freelance without IP assignment never forces a lawyer, even for high amounts", () => {
    expect(decide([serviceStandard, serviceIpHigh], { ipAssignment: false, amountMad: 500000 })).toBe("LAWYER_OPTIONAL");
    expect(decide([serviceSelfOnly], { ipAssignment: false, amountMad: 500000 })).toBe("SELF_SERVICE");
  });

  it("NDA (one-way or mutual) never forces a lawyer", () => {
    expect(decide([ndaStandard], { disclosureDirection: "MUTUAL", durationYears: 2 })).toBe("LAWYER_OPTIONAL");
    expect(decide([ndaSelfOnly], { disclosureDirection: "MUTUAL", durationYears: 2 })).toBe("SELF_SERVICE");
  });

  it("vehicle sale never forces a lawyer", () => {
    expect(decide([vehicleStandard], { salePriceMad: 65000 })).toBe("LAWYER_OPTIONAL");
    expect(decide([vehicleSelfOnly], { salePriceMad: 65000 })).toBe("SELF_SERVICE");
  });

  it("fixed-term employment contract requires a lawyer review", () => {
    expect(decide([employmentCdd], { grossMonthlySalaryMad: 8000 })).toBe("LAWYER_REQUIRED");
  });
});

describe("specialist and signature requirements", () => {
  it("routes real-estate sale to the notary / agréé lawyer, never for online sale", () => {
    const rule = makeRule({
      code: "MA-REAL-ESTATE-NOTARY-001",
      route: "SPECIALIST_REQUIRED",
      ruleKind: "LEGAL_REQUIREMENT",
      specialistRequired: true,
      specialistType: "NOTAIRE_OU_AVOCAT_CASSATION",
      manualReviewRequired: true,
      priority: 10,
      legalSource: {
        id: "src-1",
        code: "DOI-39-08",
        title: "Loi 39-08 relative au statut du notaire",
        lawNumber: "39-08",
        article: "Art. 4",
        officialUrl: "https://example.ma/loi-39-08",
        verificationStatus: "VERIFIED",
        effectiveDate: null,
        expiryDate: null,
      },
    });

    const decision = decideRoute({
      jurisdiction: "MA",
      contractType: { id: "type-1", code: "REAL_ESTATE_SALE", active: false },
      intentCode: null,
      caseData: { salePriceMad: 900000 },
      rules: [rule],
    });

    expect(decision.route).toBe("SPECIALIST_REQUIRED");
    expect(decision.specialistRequired).toBe(true);
    expect(decision.specialistType).toBe("NOTAIRE_OU_AVOCAT_CASSATION");
    expect(decision.manualReviewRequired).toBe(true);
  });

  it("the product page reads real-estate as always requiring a professional", () => {
    expect(lawyerRequirementForType(["SPECIALIST_REQUIRED"])).toBe("mandatory");
    expect(lawyerRequirementForType(["LAWYER_REQUIRED", "LAWYER_SIGNATURE_REQUIRED"])).toBe("mandatory");
    expect(lawyerRequirementForType(["SELF_SERVICE", "LAWYER_OPTIONAL"])).toBe("conditional");
    expect(lawyerRequirementForType([])).toBe("no");
  });

  it("a signature requirement only ever comes from its rule", () => {
    const commercial = makeRule({
      code: "MA-COMMERCIAL-LEASE-001",
      route: "LAWYER_SIGNATURE_REQUIRED",
      lawyerReview: "REQUIRED",
      lawyerSignature: "REQUIRED",
      priority: 20,
    });
    const decision = decideRoute({
      jurisdiction: "MA",
      contractType: { id: "type-1", code: "COMMERCIAL_LEASE", active: true },
      intentCode: null,
      caseData: {},
      rules: [commercial],
    });
    expect(decision.route).toBe("LAWYER_SIGNATURE_REQUIRED");
    expect(decision.lawyerSignatureRequirement).toBe("REQUIRED");
  });
});

describe("the engine refuses to guess", () => {
  it("falls back to ROUTING_UNDETERMINED when rules exist but none is verified", () => {
    const pending = makeRule({ status: "UNDER_REVIEW", code: "PENDING-001", route: "SELF_SERVICE" });
    const decision = decideRoute({
      jurisdiction: "MA",
      contractType: { id: "type-1", code: "TEST_TYPE", active: true },
      intentCode: null,
      caseData: {},
      rules: [pending],
    });
    expect(decision.route).toBe("ROUTING_UNDETERMINED");
  });

  it("answers UNSUPPORTED — not payable — with no rule at all for the type", () => {
    expect(decide([], {})).toBe("UNSUPPORTED");
  });

  it("does not let an unverified LEGAL_REQUIREMENT mask a verified policy", () => {
    const legal = makeRule({
      code: "MA-LEGAL-UNVERIFIED-SOURCE",
      route: "SPECIALIST_REQUIRED",
      ruleKind: "LEGAL_REQUIREMENT",
      legalSource: null,
      status: "VERIFIED",
    });
    const policy = makeRule({ code: "MA-POLICY-001", route: "SELF_SERVICE" });
    expect(decide([policy, legal], {})).toBe("SELF_SERVICE");
  });

  it("keeps jurisdiction outside MA unsupported", () => {
    const decision = decideRoute({
      jurisdiction: "FR",
      contractType: { id: "type-1", code: "TEST_TYPE", active: true },
      intentCode: null,
      caseData: {},
      rules: [makeRule({ code: "MA-TEST-001", route: "SELF_SERVICE" })],
    });
    expect(decision.route).toBe("UNSUPPORTED");
  });
});
