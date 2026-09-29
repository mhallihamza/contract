import "server-only";
import type { ConditionOperator, Language } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { rowsToStructuredCase } from "@/lib/contracts/fields";
import { renderDocument, renderTemplateText, type RenderableClause } from "@/lib/contracts/template-render";
import { buildTemplateVariables } from "@/lib/contracts/variable-map";
import { logger } from "@/lib/logging";

/**
 * Pre-payment preview (§14).
 *
 * The client must see a *realistic* document — structure, personalized values and
 * representative clauses — before paying. This module renders the approved
 * template with the case's own answers through the very same renderer that
 * produces the final document, with two deliberate differences:
 *
 *   1. nothing is persisted: no ContractVersion, no ContractDocument, no file;
 *   2. clause bodies are truncated and the result is flagged `locked`, so the
 *      complete text remains a paid deliverable.
 */

const CLAUSE_PREVIEW_CHARS = 420;

export interface PreviewFact {
  key: string;
  labelFr: string;
  labelAr: string;
}

export interface PreviewParty {
  role: string;
  name: string;
  isCompany: boolean;
}

export interface PreviewClause {
  code: string;
  titleFr: string;
  titleAr: string;
  sectionNumber: string | null;
  previewFr: string;
  previewAr: string;
  truncated: boolean;
}

export interface PreviewSection {
  sectionNumber: string;
  titleFr: string;
  titleAr: string;
}

export interface ContractPreview {
  contractId: string;
  reference: string;
  title: string;
  locale: "fr" | "ar";
  contractType: { code: string; nameFr: string; nameAr: string };
  templateVersionId: string | null;
  templateVersionNumber: number | null;
  parties: PreviewParty[];
  /** Personalized values actually used in the document. */
  facts: PreviewFact[];
  sections: PreviewSection[];
  clauses: PreviewClause[];
  sectionCount: number;
  clauseCount: number;
  /** Placeholders referenced by the approved clauses that the case does not fill. */
  unresolvedVariables: string[];
  /** Rough page estimate of the final document. */
  estimatedPages: number;
  /** Always true before payment. */
  locked: true;
}

function truncate(text: string, limit = CLAUSE_PREVIEW_CHARS): { text: string; truncated: boolean } {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return { text: normalized, truncated: false };
  return { text: `${normalized.slice(0, limit).trimEnd()}…`, truncated: true };
}

type ClauseCondition = NonNullable<RenderableClause["condition"]>;

/** Parses a stored clause condition without trusting its shape. */
function parseCondition(raw: unknown): ClauseCondition | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as { field?: unknown; operator?: unknown; value?: unknown };
  if (typeof candidate.field !== "string" || typeof candidate.operator !== "string") return null;
  const operator = candidate.operator as ConditionOperator;
  const value = candidate.value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return { field: candidate.field, operator, value };
  }
  return { field: candidate.field, operator };
}

interface TemplateClauseRow {
  clauseId: string;
  position: number;
  sectionNumber: string | null;
  requirement: RenderableClause["requirement"];
  condition: unknown;
  clause: { code: string; nameFr: string; nameAr: string; bodyFr: string; bodyAr: string };
}

function toRenderableClauses(rows: TemplateClauseRow[]): RenderableClause[] {
  return rows.map((row) => ({
    clauseId: row.clauseId,
    code: row.clause.code,
    nameFr: row.clause.nameFr,
    nameAr: row.clause.nameAr,
    bodyFr: row.clause.bodyFr,
    bodyAr: row.clause.bodyAr,
    position: row.position,
    sectionNumber: row.sectionNumber,
    requirement: row.requirement,
    condition: parseCondition(row.condition),
  }));
}

/** Approved template version of a contract type (mirrors the drafting rule). */
export async function loadActiveTemplateVersion(contractTypeId: string) {
  const template = await db.contractTemplate.findFirst({
    where: { contractTypeId, activeVersion: { isNot: null } },
    include: {
      activeVersion: {
        include: { templateClauses: { include: { clause: true }, orderBy: { position: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return template?.activeVersion ?? null;
}

/** Builds the locked, pre-payment preview of a case. Returns null if unknown. */
export async function buildContractPreview(contractId: string): Promise<ContractPreview | null> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      contractType: true,
      fields: true,
      parties: { orderBy: { position: "asc" } },
      templateVersion: {
        include: { templateClauses: { include: { clause: true }, orderBy: { position: "asc" } } },
      },
    },
  });
  if (!contract) return null;

  const version = contract.templateVersion ?? (await loadActiveTemplateVersion(contract.contractTypeId));
  const locale: "fr" | "ar" = contract.language === ("AR" as Language) ? "ar" : "fr";

  const caseData = rowsToStructuredCase(contract.fields);
  const variables = buildTemplateVariables(
    caseData,
    contract.parties.map((party) => ({
      role: party.role,
      fullName: party.fullName,
      address: party.address,
      city: party.city,
      email: party.email,
      phone: party.phone,
      nationalId: party.nationalId,
      companyName: party.companyName,
      companyTaxId: party.companyTaxId,
      representative: party.representative,
    })),
  );

  const base = {
    contractId: contract.id,
    reference: contract.reference,
    title: contract.title,
    locale,
    contractType: {
      code: contract.contractType.code,
      nameFr: contract.contractType.nameFr,
      nameAr: contract.contractType.nameAr,
    },
    parties: contract.parties.map((party) => ({
      role: party.role,
      name: party.companyName ?? party.fullName,
      isCompany: party.partyType === "COMPANY",
    })),
    facts: contract.fields.map((field) => ({
      key: field.key,
      labelFr: field.labelFr ?? field.key,
      labelAr: field.labelAr ?? field.labelFr ?? field.key,
    })),
    locked: true as const,
  };

  if (!version) {
    logger.warn("preview.template_missing", { contractId, contractTypeId: contract.contractTypeId });
    return {
      ...base,
      templateVersionId: null,
      templateVersionNumber: null,
      sections: [],
      clauses: [],
      sectionCount: 0,
      clauseCount: 0,
      unresolvedVariables: [],
      estimatedPages: 0,
    };
  }

  const renderable = toRenderableClauses(version.templateClauses);
  const rendered = renderDocument({ clauses: renderable, variables, locale, title: contract.title });

  const included = renderable
    .filter((clause) => rendered.includedClauses.includes(clause.code))
    .sort((a, b) => a.position - b.position);

  const clauses: PreviewClause[] = included.map((clause) => {
    const fr = truncate(renderTemplateText(clause.bodyFr, variables, "fr").text);
    const ar = truncate(renderTemplateText(clause.bodyAr, variables, "ar").text);
    return {
      code: clause.code,
      titleFr: clause.nameFr,
      titleAr: clause.nameAr,
      sectionNumber: clause.sectionNumber,
      previewFr: fr.text,
      previewAr: ar.text,
      truncated: fr.truncated || ar.truncated,
    };
  });

  const sections: PreviewSection[] = [];
  for (const clause of included) {
    const sectionNumber = clause.sectionNumber ?? String(sections.length + 1);
    if (sections.some((section) => section.sectionNumber === sectionNumber)) continue;
    sections.push({ sectionNumber, titleFr: clause.nameFr, titleAr: clause.nameAr });
  }

  return {
    ...base,
    templateVersionId: version.id,
    templateVersionNumber: version.versionNumber,
    sections,
    clauses,
    sectionCount: sections.length,
    clauseCount: clauses.length,
    unresolvedVariables: rendered.unresolvedVariables,
    estimatedPages: Math.max(1, Math.ceil(rendered.body.length / 3000)),
  };
}
