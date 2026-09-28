import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import type { RoutingRuleDefinition } from "./types";

/**
 * Maps persisted legal rules into the pure routing engine's input type (§11).
 * The engine never touches the database, which is what makes it unit-testable
 * and deterministic.
 */

export type RuleRow = Prisma.LegalRuleGetPayload<{
  include: { conditions: true; legalSource: true };
}>;

export function toRuleDefinition(row: RuleRow): RoutingRuleDefinition {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    ruleKind: row.ruleKind,
    status: row.status,
    active: row.active,
    jurisdiction: row.jurisdiction,
    contractTypeId: row.contractTypeId,
    scope: row.scope,
    route: row.route,
    lawyerReview: row.lawyerReview,
    lawyerSignature: row.lawyerSignature,
    specialistRequired: row.specialistRequired,
    specialistType: row.specialistType,
    writtenContractRequired: row.writtenContractRequired,
    manualReviewRequired: row.manualReviewRequired,
    priority: row.priority,
    reasonCode: row.reasonCode,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    article: row.article,
    internalPolicyRef: row.internalPolicyRef,
    legalSource: row.legalSource
      ? {
          id: row.legalSource.id,
          code: row.legalSource.code,
          title: row.legalSource.title,
          lawNumber: row.legalSource.lawNumber,
          article: row.legalSource.article,
          officialUrl: row.legalSource.officialUrl,
          verificationStatus: row.legalSource.verificationStatus,
          effectiveDate: row.legalSource.effectiveDate,
          expiryDate: row.legalSource.expiryDate,
        }
      : null,
    conditions: row.conditions.map((condition) => ({
      id: condition.id,
      field: condition.field,
      operator: condition.operator,
      valueText: condition.valueText,
      valueNumber: condition.valueNumber === null ? null : Number(condition.valueNumber),
      valueBoolean: condition.valueBoolean,
      valueList: condition.valueList,
      groupIndex: condition.groupIndex,
      label: condition.label,
    })),
  };
}

/**
 * Loads every rule that could apply to a contract type in a jurisdiction:
 * rules scoped to the type plus global rules. Verification filtering happens in
 * the engine so that excluded rules can be explained to an administrator.
 */
export async function loadRoutingRules(params: {
  contractTypeId: string | null;
  jurisdiction: string;
}): Promise<RoutingRuleDefinition[]> {
  const rows = await db.legalRule.findMany({
    where: {
      jurisdiction: params.jurisdiction,
      OR: [
        ...(params.contractTypeId ? [{ contractTypeId: params.contractTypeId }] : []),
        { contractTypeId: null },
      ],
    },
    include: { conditions: true, legalSource: true },
    orderBy: [{ priority: "asc" }, { code: "asc" }],
  });
  return rows.map(toRuleDefinition);
}

/** Rules that a legal reviewer still has to confirm (admin dashboard §31). */
export async function countRulesNeedingReview(): Promise<number> {
  return db.legalRule.count({
    where: { OR: [{ status: { in: ["DRAFT", "UNDER_REVIEW"] } }, { legalSource: { verificationStatus: { not: "VERIFIED" } } }] },
  });
}
