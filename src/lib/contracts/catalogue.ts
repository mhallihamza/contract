import type { ContractCategory, RiskLevel, RoutingRoute } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { quoteService } from "@/lib/payments/pricing";
import { getFieldSpecs } from "./field-catalog";
import { loadActiveTemplateVersion } from "./preview";
import { buildServiceOffers } from "./service-offers";

/**
 * Public catalogue (§6, §7).
 *
 * The catalogue is a *view* of the database: contract types, their verified rules
 * and the platform pricing. Nothing here is hardcoded per document, so adding a
 * contract type is an admin operation — the marketing pages follow automatically.
 *
 * Prices and "lawyer available" badges come from the same pricing engine and the
 * same VERIFIED rules routing uses, so the catalogue can never advertise a service
 * the engine would refuse for a given case.
 */

const CATEGORY_LABEL: Record<ContractCategory, { fr: string; ar: string }> = {
  RENTAL: { fr: "Immobilier", ar: "العقار" },
  SERVICES: { fr: "Prestation & Business", ar: "الخدمات والأعمال" },
  EMPLOYMENT: { fr: "Travail", ar: "الشغل" },
  CONFIDENTIALITY: { fr: "Confidentialité", ar: "السرية" },
  SALE: { fr: "Vente", ar: "البيع" },
  PARTNERSHIP: { fr: "Société & Partenariat", ar: "الشركات والشراكة" },
  LOAN: { fr: "Prêt", ar: "القرض" },
  AUTHORIZATION: { fr: "Autorisation", ar: "التوكيل" },
  OTHER: { fr: "Autres", ar: "أخرى" },
};

/**
 * Guard for the `?category=` deep links the marketing pages publish (homepage
 * solution cards, footer columns). Anything else is ignored rather than fed to
 * the filter, so an unknown value can never empty the catalogue.
 */
export function isContractCategory(value: string | undefined): value is ContractCategory {
  return value !== undefined && Object.prototype.hasOwnProperty.call(CATEGORY_LABEL, value);
}

export interface CatalogueItem {
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  category: ContractCategory;
  categoryLabelFr: string;
  categoryLabelAr: string;
  riskLevel: RiskLevel;
  /** Approximate: derived from the number of questions actually asked. */
  completionMinutes: number;
  questionCount: number;
  /** Cheapest published path for this document, from the pricing engine. */
  startingPrice: number;
  currency: string;
  lawyerReviewAvailable: boolean;
  signatureAvailable: boolean;
  requiredDocuments: string[];
  supportedLanguages: string[];
}

export interface CatalogueGroup {
  category: ContractCategory;
  labelFr: string;
  labelAr: string;
  items: CatalogueItem[];
}

/** Routes the VERIFIED rules of these contract types allow (globals included). */
async function loadAvailableRoutes(contractTypeIds: string[]): Promise<Map<string, RoutingRoute[]>> {
  const rules = await db.legalRule.findMany({
    where: {
      active: true,
      status: "VERIFIED",
      OR: [{ contractTypeId: { in: contractTypeIds } }, { contractTypeId: null }],
    },
    select: { contractTypeId: true, route: true },
  });

  const map = new Map<string, RoutingRoute[]>();
  for (const id of contractTypeIds) map.set(id, []);
  for (const rule of rules) {
    const targets = rule.contractTypeId ? [rule.contractTypeId] : contractTypeIds;
    for (const id of targets) {
      const routes = map.get(id);
      if (routes && !routes.includes(rule.route)) routes.push(rule.route);
    }
  }
  return map;
}

interface RoutePricing {
  startingPrice: number;
  lawyerAvailable: boolean;
  signatureAvailable: boolean;
}

function priceForRoutes(routes: RoutingRoute[], currency: string): RoutePricing {
  const candidates: number[] = [];
  let lawyerAvailable = false;
  let signatureAvailable = false;

  for (const route of routes) {
    const offers = buildServiceOffers({ route, currency });
    if (offers.blocked) continue;
    for (const offer of offers.offers) {
      if (!offer.quote.payable) continue;
      candidates.push(offer.quote.amount);
      if (offer.key === "LAWYER_REVIEW") lawyerAvailable = true;
      if (offer.key === "LAWYER_REQUIRED") {
        lawyerAvailable = true;
        if (offer.includesSignature) signatureAvailable = true;
      }
    }
  }

  const fallback = quoteService({
    route: "SELF_SERVICE",
    lawyerServiceSelected: false,
    signatureRequired: false,
    currency,
  });

  return {
    startingPrice: candidates.length > 0 ? Math.min(...candidates) : fallback.amount,
    lawyerAvailable,
    signatureAvailable,
  };
}

function estimateMinutes(questionCount: number, hasLawyerBranch: boolean): number {
  const base = 2 + questionCount * 1.5 + (hasLawyerBranch ? 1 : 0);
  return Math.max(5, Math.round(base / 5) * 5);
}

interface RawType {
  id: string;
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  category: ContractCategory;
  riskLevel: RiskLevel;
  requiredFields: string[];
  requiredDocuments: string[];
  supportedLanguages: string[];
}

function toItem(type: RawType, routes: RoutingRoute[], currency: string): CatalogueItem {
  const specs = getFieldSpecs(type.code);
  const questionCount = Math.max(specs.filter((spec) => spec.required).length, type.requiredFields.length);
  const price = priceForRoutes(routes, currency);

  return {
    code: type.code,
    slug: type.slug,
    nameFr: type.nameFr,
    nameAr: type.nameAr,
    descriptionFr: type.descriptionFr ?? "",
    descriptionAr: type.descriptionAr ?? "",
    category: type.category,
    categoryLabelFr: CATEGORY_LABEL[type.category].fr,
    categoryLabelAr: CATEGORY_LABEL[type.category].ar,
    riskLevel: type.riskLevel,
    completionMinutes: estimateMinutes(questionCount, price.lawyerAvailable),
    questionCount: specs.length,
    startingPrice: price.startingPrice,
    currency,
    lawyerReviewAvailable: price.lawyerAvailable,
    signatureAvailable: price.signatureAvailable,
    requiredDocuments: type.requiredDocuments,
    supportedLanguages: type.supportedLanguages,
  };
}

const TYPE_SELECT = {
  id: true,
  code: true,
  slug: true,
  nameFr: true,
  nameAr: true,
  descriptionFr: true,
  descriptionAr: true,
  category: true,
  riskLevel: true,
  requiredFields: true,
  requiredDocuments: true,
  supportedLanguages: true,
} as const;

/** Whole catalogue, grouped by category — the `/contracts` page. */
export async function loadCatalogue(currency: string): Promise<CatalogueGroup[]> {
  const types = await db.contractType.findMany({
    where: { active: true, status: "ACTIVE" },
    orderBy: [{ category: "asc" }, { nameFr: "asc" }],
    select: TYPE_SELECT,
  });
  if (types.length === 0) return [];

  const routes = await loadAvailableRoutes(types.map((type) => type.id));

  const groups = new Map<ContractCategory, CatalogueGroup>();
  for (const type of types) {
    const item = toItem(type, routes.get(type.id) ?? [], currency);
    const group = groups.get(type.category) ?? {
      category: type.category,
      labelFr: CATEGORY_LABEL[type.category].fr,
      labelAr: CATEGORY_LABEL[type.category].ar,
      items: [],
    };
    group.items.push(item);
    groups.set(type.category, group);
  }
  return [...groups.values()];
}

/** One catalogue entry, resolved through its public slug — the product page. */
export async function loadCatalogueItem(slug: string, currency: string): Promise<CatalogueItem | null> {
  const type = await db.contractType.findFirst({
    where: { slug, active: true, status: "ACTIVE" },
    select: TYPE_SELECT,
  });
  if (!type) return null;

  const routes = await loadAvailableRoutes([type.id]);
  return toItem(type, routes.get(type.id) ?? [], currency);
}

export function catalogueCategoryLabel(category: ContractCategory, locale: "fr" | "ar"): string {
  const label = CATEGORY_LABEL[category];
  return locale === "ar" ? label.ar : label.fr;
}

/** What the approved template of a document actually contains (product page §7). */
export async function loadDocumentOutline(
  contractTypeCode: string,
): Promise<{ sectionCount: number; clauseCount: number; templateVersionNumber: number | null }> {
  const type = await db.contractType.findUnique({
    where: { code: contractTypeCode },
    select: { id: true },
  });
  if (!type) return { sectionCount: 0, clauseCount: 0, templateVersionNumber: null };

  const version = await loadActiveTemplateVersion(type.id);
  if (!version) return { sectionCount: 0, clauseCount: 0, templateVersionNumber: null };

  const sections = new Set<string>();
  version.templateClauses.forEach((clause, index) => {
    sections.add(clause.sectionNumber ?? String(index + 1));
  });

  return {
    sectionCount: sections.size,
    clauseCount: version.templateClauses.length,
    templateVersionNumber: version.versionNumber,
  };
}
