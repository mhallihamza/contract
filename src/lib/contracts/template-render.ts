import type { ConditionOperator } from "@prisma/client";
import type { StructuredCase } from "@/lib/legal-routing/types";
import { evaluateCondition } from "@/lib/legal-routing/conditions";

/**
 * Template rendering (§15, §16).
 *
 * The draft is produced from approved clauses only. The model may phrase an
 * introduction, but it cannot add, remove or reword a clause: every clause comes
 * from the versioned template, is rendered with validated variables, and its
 * inclusion condition is evaluated deterministically.
 */

export interface RenderableClause {
  clauseId: string;
  code: string;
  nameFr: string;
  nameAr: string;
  bodyFr: string;
  bodyAr: string;
  position: number;
  sectionNumber: string | null;
  requirement: "REQUIRED" | "OPTIONAL" | "CONDITIONAL";
  condition: { field: string; operator: ConditionOperator; value?: string | number | boolean } | null;
}

export interface RenderedClause {
  code: string;
  title: string;
  sectionNumber: string | null;
  included: boolean;
  reason: string;
  text: string;
  /** Placeholders referenced by the clause that did not resolve. */
  unresolvedVariables: string[];
}

export interface RenderedDocument {
  body: string;
  sections: { sectionNumber: string; title: string; clauses: string[] }[];
  includedClauses: string[];
  excludedClauses: { code: string; reason: string }[];
  unresolvedVariables: string[];
  missingVariables: string[];
}

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function extractVariables(template: string): string[] {
  return [...template.matchAll(VARIABLE_PATTERN)].map((match) => match[1]!);
}

function formatVariable(value: unknown, locale: "fr" | "ar"): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? (locale === "ar" ? "نعم" : "oui") : locale === "ar" ? "لا" : "non";
  if (typeof value === "number") return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA").format(value);
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function renderTemplateText(
  template: string,
  variables: StructuredCase,
  locale: "fr" | "ar" = "fr",
): { text: string; unresolved: string[] } {
  const unresolved: string[] = [];
  const text = template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null || value === "") {
      unresolved.push(key);
      return `[${key}]`;
    }
    return formatVariable(value, locale);
  });
  return { text, unresolved };
}

export function clauseIncluded(clause: RenderableClause, caseData: StructuredCase): { included: boolean; reason: string } {
  if (clause.requirement === "REQUIRED" || clause.requirement === "OPTIONAL") {
    return { included: true, reason: clause.requirement === "REQUIRED" ? "clause obligatoire" : "clause facultative retenue" };
  }
  if (!clause.condition) {
    return { included: false, reason: "clause conditionnelle sans condition définie" };
  }
  const evaluation = evaluateCondition(
    {
      field: clause.condition.field,
      operator: clause.condition.operator,
      valueText: typeof clause.condition.value === "string" ? clause.condition.value : null,
      valueNumber: typeof clause.condition.value === "number" ? clause.condition.value : null,
      valueBoolean: typeof clause.condition.value === "boolean" ? clause.condition.value : null,
      groupIndex: 0,
    },
    caseData,
  );
  return { included: evaluation.passed, reason: evaluation.detail };
}

export interface RenderDocumentInput {
  clauses: RenderableClause[];
  variables: StructuredCase;
  locale: "fr" | "ar";
  /** Paragraphs supplied by the drafting assistant (already approved wording). */
  introduction?: string[];
  title: string;
}

export function renderDocument(input: RenderDocumentInput): RenderedDocument {
  const includedClauses: string[] = [];
  const excludedClauses: { code: string; reason: string }[] = [];
  const unresolvedVariables = new Set<string>();
  const sections: RenderedDocument["sections"] = [];
  const paragraphs: string[] = [input.title, "".padEnd(1)];

  if (input.introduction && input.introduction.length > 0) {
    paragraphs.push(...input.introduction, "");
  }

  const ordered = [...input.clauses].sort((a, b) => a.position - b.position);

  for (const clause of ordered) {
    const decision = clauseIncluded(clause, input.variables);
    if (!decision.included) {
      excludedClauses.push({ code: clause.code, reason: decision.reason });
      continue;
    }
    const body = input.locale === "ar" ? clause.bodyAr : clause.bodyFr;
    const title = input.locale === "ar" ? clause.nameAr : clause.nameFr;
    const rendered = renderTemplateText(body, input.variables, input.locale);
    rendered.unresolved.forEach((key) => unresolvedVariables.add(key));

    const sectionNumber = clause.sectionNumber ?? String(sections.length + 1);
    const heading = `${sectionNumber}. ${title}`;
    paragraphs.push(heading, rendered.text, "");
    includedClauses.push(clause.code);

    const existing = sections.find((section) => section.sectionNumber === sectionNumber);
    if (existing) existing.clauses.push(clause.code);
    else sections.push({ sectionNumber, title, clauses: [clause.code] });
  }

  const body = paragraphs.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const declaredVariables = new Set<string>();
  for (const clause of ordered) {
    const source = input.locale === "ar" ? clause.bodyAr : clause.bodyFr;
    extractVariables(source).forEach((key) => declaredVariables.add(key));
  }
  const missingVariables = [...declaredVariables].filter((key) => {
    const value = input.variables[key];
    return value === undefined || value === null || value === "";
  });

  return {
    body,
    sections,
    includedClauses,
    excludedClauses,
    unresolvedVariables: [...unresolvedVariables],
    missingVariables,
  };
}
