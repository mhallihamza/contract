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
  [CONTRACT_TYPE_CODES.employmentCdi]: "contrat-travail-cdi",
  [CONTRACT_TYPE_CODES.realEstateSale]: "compromis-vente-immobiliere",
  [CONTRACT_TYPE_CODES.furnishedLease]: "contrat-location-meublee",
  [CONTRACT_TYPE_CODES.seasonalLease]: "contrat-location-saisonniere",
  [CONTRACT_TYPE_CODES.loanAgreement]: "contrat-pret-particuliers",
  [CONTRACT_TYPE_CODES.powerOfAttorney]: "procuration",
};

export async function seedContractTypes(db: PrismaClient) {
  const typeResidentialLease = await db.contractType.upsert({    where: { code: CONTRACT_TYPE_CODES.residentialLease },
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

  const typeVehicleSale = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.vehicleSale },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.vehicleSale]! },
    create: {
      code: CONTRACT_TYPE_CODES.vehicleSale,
      slug: SLUGS[CONTRACT_TYPE_CODES.vehicleSale]!,
      nameFr: "Vente de véhicule",
      nameAr: "بيع سيارة",
      descriptionFr:
        "Acte de vente d'un véhicule d'occasion entre particuliers ou professionnels, avec les mentions du certificat d'immatriculation.",
      descriptionAr: "عقد بيع سيارة مستعملة بين الأفراد أو المهنيين، مع البيانات المسجلة ببطاقة الرجل.",
      category: "SALE",
      riskLevel: "MEDIUM",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["SELL_VEHICLE", "VENTE_VEHICULE", "بيع_سيارة"],
      requiredFields: ["vehicleMake", "vehicleModel", "registrationNumber", "salePriceMad", "saleDate"],
      requiredDocuments: ["Certificat d'immatriculation (carte grise)", "CIN des deux parties"],
    },
  });

  const typeEmploymentCdd = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.employmentCdd },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.employmentCdd]! },
    create: {
      code: CONTRACT_TYPE_CODES.employmentCdd,
      slug: SLUGS[CONTRACT_TYPE_CODES.employmentCdd]!,
      nameFr: "Contrat de travail à durée déterminée (CDD)",
      nameAr: "عقد عمل محدد المدة",
      descriptionFr:
        "Contrat de travail à durée déterminée: le Code du travail limite ses cas de recours, un professionnel vérifie leur fondement.",
      descriptionAr: "عقد عمل محدد المدة: يشترط مدونة الشغل حالات محددة لاستعماله، ويتحقق مهني من أساس استعمالها.",
      category: "EMPLOYMENT",
      riskLevel: "HIGH",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["EMPLOYMENT_CDD", "CONTRAT_CDD", "عقد_عمل_مؤقت"],
      requiredFields: ["position", "grossMonthlySalaryMad", "contractStartDate", "contractEndDate", "workplace"],
      requiredDocuments: ["CIN de l'employé", "Certificat d'affiliation CNSS de l'employeur"],
    },
  });

  const typeEmploymentCdi = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.employmentCdi },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.employmentCdi]! },
    create: {
      code: CONTRACT_TYPE_CODES.employmentCdi,
      slug: SLUGS[CONTRACT_TYPE_CODES.employmentCdi]!,
      nameFr: "Contrat de travail à durée indéterminée (CDI)",
      nameAr: "عقد عمل غير محدد المدة",
      descriptionFr:
        "Contrat de travail à durée indéterminée: la forme normale du lien de travail, la rupture dépend de motifs légaux et d'un préavis — un avocat vérifie la conformité des clauses.",
      descriptionAr: "عقد عمل غير محدد المدة: الشكل الطبيعي للعلاقة الشغل، إنهاؤه يعتمد على أسباب قانونية ومدة إشعار — محامي يتحقق من مطابقة البنود.",
      category: "EMPLOYMENT",
      riskLevel: "MEDIUM",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["EMPLOYMENT_CDI", "CONTRAT_CDI", "عقد_عمل_دائم"],
      requiredFields: ["position", "grossMonthlySalaryMad", "startDate", "workplace"],
      requiredDocuments: ["CIN de l'employé", "Certificat d'affiliation CNSS de l'employeur"],
    },
  });

  const typeFurnishedLease = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.furnishedLease },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.furnishedLease]! },
    create: {
      code: CONTRACT_TYPE_CODES.furnishedLease,
      slug: SLUGS[CONTRACT_TYPE_CODES.furnishedLease]!,
      nameFr: "Bail d'habitation meublé",
      nameAr: "عقد كراء سكني مفروش",
      descriptionFr: "Contrat de location résidentielle meublée soumis à la loi 67-12, avec inventaire du mobilier.",
      descriptionAr: "عقد كراء سكني مفروش خاضع لمقتضيات القانون رقم 67.12، مع جرد الأثاث.",
      category: "RENTAL",
      riskLevel: "LOW",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["FURNISHED_LEASE", "LOCATION_MEUBLEE", "كراء_مفروش"],
      requiredFields: ["clientRole", "propertyAddress", "propertyCity", "durationMonths", "startDate", "rentAmountMad"],
      requiredDocuments: ["CIN / Titre de séjour du bailleur et locataire", "Inventaire du mobilier"],
    },
  });

  const typeSeasonalLease = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.seasonalLease },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.seasonalLease]! },
    create: {
      code: CONTRACT_TYPE_CODES.seasonalLease,
      slug: SLUGS[CONTRACT_TYPE_CODES.seasonalLease]!,
      nameFr: "Bail saisonnier (location de vacances)",
      nameAr: "عقد كراء موسمي",
      descriptionFr: "Contrat de location courte durée à usage de villégiature, date de fin fixe, pas de reconduction tacite.",
      descriptionAr: "عقد كراء قصير المدة لغرض المصطاف، تاريخ نهاية ثابت، لا تجديد تلقائي.",
      category: "RENTAL",
      riskLevel: "LOW",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["SEASONAL_LEASE", "LOCATION_SAISONNIERE", "كراء_موسمي"],
      requiredFields: ["clientRole", "propertyAddress", "propertyCity", "startDate", "endDate", "rentAmountMad"],
      requiredDocuments: ["CIN / Titre de séjour du bailleur et locataire"],
    },
  });

  const typeLoanAgreement = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.loanAgreement },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.loanAgreement]! },
    create: {
      code: CONTRACT_TYPE_CODES.loanAgreement,
      slug: SLUGS[CONTRACT_TYPE_CODES.loanAgreement]!,
      nameFr: "Prêt entre particuliers",
      nameAr: "قرض بين الأفراد",
      descriptionFr: "Convention de prêt d'argent entre personnes physiques, régie par le Dahir des Obligations et des Contrats.",
      descriptionAr: "اتفاقية إقراض مبالغ مالية بين الأشخاص الطبيعيَّة، خاضعة لظهير الالتزامات والعقود.",
      category: "LOAN",
      riskLevel: "MEDIUM",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["LOAN_AGREEMENT", "PRET_ENTRE_PARTICULIERS", "قرض_بين_أفراد"],
      requiredFields: ["lenderName", "borrowerName", "loanAmountMad", "repaymentTerms", "loanDate"],
      requiredDocuments: ["CIN des deux parties"],
    },
  });

  const typePowerOfAttorney = await db.contractType.upsert({
    where: { code: CONTRACT_TYPE_CODES.powerOfAttorney },
    update: { active: true, status: "ACTIVE", slug: SLUGS[CONTRACT_TYPE_CODES.powerOfAttorney]! },
    create: {
      code: CONTRACT_TYPE_CODES.powerOfAttorney,
      slug: SLUGS[CONTRACT_TYPE_CODES.powerOfAttorney]!,
      nameFr: "Procuration (tawkila)",
      nameAr: "توكيل",
      descriptionFr: "Mandat donné à une personne pour agir au nom d'une autre, limité aux actes administratifs courants (hors actes notariés).",
      descriptionAr: "تفويض يُعطى لشخص ليتصرف نيابة عن آخر، يقتصر على الأعمال الإدارية المعتادة (باستثناء الأعمال التوثيقية).",
      category: "AUTHORIZATION",
      riskLevel: "LOW",
      status: "ACTIVE",
      active: true,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: ["POWER_OF_ATTORNEY", "PROCURATION", "تفويض"],
      requiredFields: ["mandantName", "mandataireName", "mandatePurpose", "mandateStartDate"],
      requiredDocuments: ["CIN du mandant et du mandataire"],
    },
  });

  /**
   * Synthetic type of §8b — an uploaded document under examination never goes
   * through the questionnaire, the routing engine or the catalogue: the case
   * exists so the uploaded file has a contract type and a lifecycle. Kept
   * inactive on purpose; verification contracts are created server-side only.
   */
  const typeVerificationExamination = await db.contractType.upsert({
    where: { code: "VERIFICATION_EXAMINATION" },
    update: { active: false, status: "DRAFT" },
    create: {
      code: "VERIFICATION_EXAMINATION",
      slug: "verification-document-existant",
      nameFr: "Vérification d'un document existant",
      nameAr: "التحقق من وثيقة جاهزة",
      descriptionFr: "Dossier technique portant un document déjà rédigé, soumis à vérification. Non commercialisé.",
      descriptionAr: "ملف تقني يخص وثيقة مُعدّة سلفاً وتخضع للتحقق. غير معروض للبيع.",
      category: "OTHER",
      riskLevel: "LOW",
      status: "DRAFT",
      active: false,
      defaultLanguage: "FR",
      supportedLanguages: ["FR", "AR"],
      intents: [],
      requiredFields: [],
      requiredDocuments: [],
    },
  });

  return {
    typeResidentialLease,
    typeFreelanceService,
    typeNDA,
    typeCommercialLease,
    typeRealEstateSale,
    typeVehicleSale,
    typeEmploymentCdd,
    typeEmploymentCdi,
    typeFurnishedLease,
    typeSeasonalLease,
    typeLoanAgreement,
    typePowerOfAttorney,
    typeVerificationExamination,
  };
}
