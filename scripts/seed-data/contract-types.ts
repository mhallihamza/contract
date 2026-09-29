import { PrismaClient } from "@prisma/client";
import { CONTRACT_TYPE_CODES } from "../../src/lib/contracts/field-catalog";

/**
 * Public URL segments (§14). Declared here — not derived from the code — so the
 * catalogue URLs stay stable, readable and localised for the Moroccan market.
 */
const SLUGS: Record<string, string> = {
  [CONTRACT_TYPE_CODES.residentialLease]: "contrat-location-habitation",
  [CONTRACT_TYPE_CODES.freelanceService]: "contrat-prestation-services",
  [CONTRACT_TYPE_CODES.nda]: "accord-confidentialite-nda",
  [CONTRACT_TYPE_CODES.commercialLease]: "bail-commercial",
  [CONTRACT_TYPE_CODES.vehicleSale]: "contrat-vente-vehicule",
  [CONTRACT_TYPE_CODES.employmentCdd]: "contrat-travail-cdd",
  [CONTRACT_TYPE_CODES.realEstateSale]: "compromis-vente-immobiliere",
};

export async function seedContractTypes(db: PrismaClient) {
  const typeResidentialLease = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.residentialLease },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.residentialLease]! },
    create: {
      code: CONTRACT_TYPE_CODES.residentialLease,
      slug: SLUGS[CONTRACT_TYPE_CODES.residentialLease]!,
      nameFr: "Bail d'habitation",
      nameAr: "عقد كراء سكني",
      descriptionFr: "Contrat de location résidentielle soumis à la loi 67-12.",
      descriptionAr: "عقد كراء مخصص للسكن خاضع لمقتضيات القانون رقم 67.12.",
      category: "RENTAL",
      riskLevel: "LOW",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["RENT_RESIDENTIAL_PROPERTY", "LOCATION_APPARTEMENT", "BAIL_HABITATION"],
      requiredFields: [
        "clientRole",
        "propertyAddress",
        "propertyCity",
        "durationMonths",
        "startDate",
        "rentAmountMad",
      ],
      requiredDocuments: ["CIN / Titre de séjour du bailleur et locataire"],
    },
  });

  const typeFreelanceService = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.freelanceService },
    update: { active: true, status: "ACTIVE" },
    create: {
      code: CONTRACT_TYPE_CODES.freelanceService,
      slug: SLUGS[CONTRACT_TYPE_CODES.freelanceService]!,
      nameFr: "Contrat de prestation de services / Freelance",
      nameAr: "عقد تقديم خدمات / عمل حر",
      descriptionFr: "Convention de prestation intellectuelle ou technique indépendante régie par le DOC.",
      descriptionAr: "اتفاقية تقديم خدمات تقنية أو استشارية خاضعة لقانون الالتزامات والعقود.",
      category: "SERVICES",
      riskLevel: "MEDIUM",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["FREELANCE_SERVICE", "PRESTATION_SERVICE", "MISSION_CONSULTANT"],
      requiredFields: ["clientRole", "serviceDescription", "amountMad", "startDate"],
      requiredDocuments: ["Devis ou cahier des charges"],
    },
  });

  const typeNDA = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.nda },
    update: { active: true, status: "ACTIVE" },
    create: {
      code: CONTRACT_TYPE_CODES.nda,
      slug: SLUGS[CONTRACT_TYPE_CODES.nda]!,
      nameFr: "Accord de confidentialité (NDA)",
      nameAr: "اتفاقية عدم إفصاح وسرية",
      descriptionFr: "Protection d'informations confidentielles commerciales ou technologiques.",
      descriptionAr: "حماية المعلومات السرية المتبادلة بين الشركاء أو المتعاقدين.",
      category: "CONFIDENTIALITY",
      riskLevel: "LOW",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["PROTECT_CONFIDENTIAL_INFORMATION", "ACCORD_CONFIDENTIALITE", "NDA"],
      requiredFields: ["disclosureDirection", "confidentialScope", "durationYears"],
      requiredDocuments: [],
    },
  });

  const typeCommercialLease = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.commercialLease },
    update: { active: true, status: "ACTIVE" },
    create: {
      code: CONTRACT_TYPE_CODES.commercialLease,
      slug: SLUGS[CONTRACT_TYPE_CODES.commercialLease]!,
      nameFr: "Bail commercial (Loi 49-16)",
      nameAr: "عقد كراء تجاري (القانون 49.16)",
      descriptionFr: "Bail de local à usage commercial, industriel ou artisanal.",
      descriptionAr: "عقد كراء محل تجاري أو مهني أو حرفي خاضع للقانون 49.16.",
      category: "RENTAL",
      riskLevel: "HIGH",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["COMMERCIAL_LEASE", "BAIL_COMMERCIAL"],
      requiredFields: ["businessActivity", "premisesAddress", "premisesCity", "durationYears", "rentAmountMad"],
      requiredDocuments: ["Registre de Commerce (RC)", "Certificat de propriété"],
    },
  });

  const typeRealEstateSale = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.realEstateSale },
    update: { active: false, status: "DRAFT" },
    create: {
      code: CONTRACT_TYPE_CODES.realEstateSale,
      slug: SLUGS[CONTRACT_TYPE_CODES.realEstateSale]!,
      nameFr: "Vente immobilière",
      nameAr: "بيع عقار",
      descriptionFr: "Vente d'immeuble ou de terrain soumise obligatoirement à acte notarié (non traité en ligne).",
      descriptionAr: "بيع عقار أو أرض يستوجب قانوناً محرراً رسمياً من موثق.",
      category: "SALE",
      riskLevel: "CRITICAL",
      status: "DRAFT",
      active: false,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["SELL_REAL_ESTATE", "VENTE_IMMOBILIERE"],
      requiredFields: ["propertyAddress", "propertyCity", "salePriceMad"],
      requiredDocuments: ["Certificat de propriété foncière"],
    },
  });

  return {
    typeResidentialLease,
    typeFreelanceService,
    typeNDA,
    typeCommercialLease,
    typeRealEstateSale,
  };
}
