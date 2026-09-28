import type { LawyerSummary, SummarizeForLawyerInput } from "./ai-provider";
import { formatCaseValue } from "@/lib/contracts/fields";

/**
 * Lawyer summary (§42).
 *
 * Built deterministically from the structured case so it can never contain a
 * fabricated fact. The output is explicitly flagged as AI-assisted so the
 * lawyer knows which parts were machine-generated — the legal review itself
 * always remains the lawyer's responsibility.
 */

const FIELD_LABELS: Record<string, { fr: string; ar: string }> = {
  clientRole: { fr: "Rôle du client", ar: "صفة العميل" },
  propertyType: { fr: "Type de bien", ar: "نوع المحل" },
  propertyAddress: { fr: "Adresse du bien", ar: "عنوان المحل" },
  propertyCity: { fr: "Ville", ar: "المدينة" },
  propertySurfaceM2: { fr: "Surface (m²)", ar: "المساحة (م²)" },
  furnished: { fr: "Meublé", ar: "مفروش" },
  durationMonths: { fr: "Durée (mois)", ar: "المدة (أشهر)" },
  durationYears: { fr: "Durée (années)", ar: "المدة (سنوات)" },
  startDate: { fr: "Date de début", ar: "تاريخ البدء" },
  endDate: { fr: "Date de fin", ar: "تاريخ النهاية" },
  rentAmountMad: { fr: "Loyer mensuel (MAD)", ar: "الوجيبة الشهرية (درهم)" },
  paymentFrequency: { fr: "Périodicité", ar: "الدورية" },
  securityDepositMad: { fr: "Dépôt de garantie (MAD)", ar: "الضمانة (درهم)" },
  chargesIncluded: { fr: "Charges incluses", ar: "التكاليف مدمجة" },
  petsAllowed: { fr: "Animaux autorisés", ar: "الحيوانات مسموح بها" },
  serviceDescription: { fr: "Prestation", ar: "الخدمة" },
  deliverables: { fr: "Livrables", ar: "المخرجات" },
  amountMad: { fr: "Montant (MAD)", ar: "المبلغ (درهم)" },
  paymentSchedule: { fr: "Échelonnement", ar: "التقسيط" },
  latePaymentPenalty: { fr: "Pénalité de retard", ar: "غرامة التأخير" },
  ipAssignment: { fr: "Cession de droits", ar: "التنازل عن الحقوق" },
  confidentialityIncluded: { fr: "Clause de confidentialité", ar: "بند السرية" },
  disclosureDirection: { fr: "Sens de la confidentialité", ar: "اتجاه السرية" },
  confidentialScope: { fr: "Informations confidentielles", ar: "المعلومات السرية" },
  purpose: { fr: "Objectif", ar: "الغرض" },
  businessActivity: { fr: "Activité", ar: "النشاط" },
  premisesAddress: { fr: "Adresse du local", ar: "عنوان المحل" },
  premisesCity: { fr: "Ville", ar: "المدينة" },
  renewalOption: { fr: "Renouvellement", ar: "التجديد" },
  vehicleMake: { fr: "Marque", ar: "الماركة" },
  vehicleModel: { fr: "Modèle", ar: "الطراز" },
  registrationNumber: { fr: "Immatriculation", ar: "التسجيل" },
  mileageKm: { fr: "Kilométrage", ar: "الكيلومتراج" },
  salePriceMad: { fr: "Prix de vente (MAD)", ar: "ثمن البيع (درهم)" },
  paymentMode: { fr: "Moyen de paiement", ar: "طريقة الأداء" },
  saleDate: { fr: "Date de vente", ar: "تاريخ البيع" },
  position: { fr: "Poste", ar: "المنصب" },
  grossMonthlySalaryMad: { fr: "Salaire brut (MAD)", ar: "الأجر الخام (درهم)" },
};

export function labelForField(key: string, locale: "fr" | "ar" = "fr"): string {
  const labels = FIELD_LABELS[key];
  if (!labels) return key;
  return locale === "ar" ? labels.ar : labels.fr;
}

export function buildLawyerSummary(input: SummarizeForLawyerInput): LawyerSummary {
  const facts = Object.entries(input.facts).map(
    ([key, value]) => `${labelForField(key)} : ${formatCaseValue(value as never)}`,
  );

  const keyTerms = Object.entries(input.facts)
    .filter(([key]) => /(amount|price|rent|deposit|duration|salary|frequency|schedule)/i.test(key))
    .map(([key, value]) => `${labelForField(key)} : ${formatCaseValue(value as never)}`);

  return {
    objective: input.objective,
    parties: input.parties.map((party) => `${party.role} — ${party.name} (${party.type})`),
    facts,
    keyTerms,
    documents: input.documents,
    missingInformation: input.missingInformation,
    routingSummary: input.routingSummary,
    configuredRules: input.configuredRules,
    draftSummary: input.draftSummary,
    reviewAreas: [
      "Identification complète des parties et de leurs représentants",
      "Exactitude des montants, durées et dates reprises dans le document",
      "Cohérence des clauses facultatives activées avec la situation réelle",
      "Points signalés comme non déterminés dans la décision de routage",
    ],
    aiGenerated: true,
  };
}

/** Renders the summary for the lawyer workspace (sections of §42). */
export function renderLawyerSummary(summary: LawyerSummary): { title: string; body: string[] }[] {
  return [
    { title: "OBJECTIF", body: [summary.objective] },
    { title: "PARTIES", body: summary.parties.length > 0 ? summary.parties : ["—"] },
    { title: "FAITS", body: summary.facts.length > 0 ? summary.facts : ["—"] },
    { title: "TERMES CLÉS", body: summary.keyTerms.length > 0 ? summary.keyTerms : ["—"] },
    { title: "DOCUMENTS", body: summary.documents.length > 0 ? summary.documents : ["Aucun document joint"] },
    {
      title: "INFORMATIONS MANQUANTES",
      body: summary.missingInformation.length > 0 ? summary.missingInformation : ["Aucune information manquante identifiée"],
    },
    { title: "DÉCISION DE ROUTAGE", body: [summary.routingSummary] },
    {
      title: "RÈGLES CONFIGURÉES APPLIQUÉES",
      body: summary.configuredRules.length > 0 ? summary.configuredRules : ["Aucune règle vérifiée n'a pu être appliquée"],
    },
    { title: "RÉSUMÉ DU PROJET", body: [summary.draftSummary] },
    { title: "POINTS À VÉRIFIER", body: summary.reviewAreas },
  ];
}
