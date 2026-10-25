import type { PrismaClient } from "@prisma/client";

export async function seedLegalRules(
  db: PrismaClient,
  types: {
    typeResidentialLease: { id: string };
    typeFreelanceService: { id: string };
    typeCommercialLease: { id: string };
    typeRealEstateSale: { id: string };
    typeNda: { id: string };
    typeVehicleSale: { id: string };
    typeEmploymentCdd: { id: string };
    typeEmploymentCdi: { id: string };
    typeFurnishedLease: { id: string };
    typeSeasonalLease: { id: string };
    typeLoanAgreement: { id: string };
    typePowerOfAttorney: { id: string };
  },
  sources: {
    sourceLoi6712: { id: string };
    sourceLoi6599: { id: string };
    sourceLoi4916: { id: string };
    sourceLoi3908: { id: string };
  },
  adminId: string,
) {
  // 1. Residential Lease Standard -> SELF_SERVICE
  const ruleLeaseStandard = await db.legalRule.upsert({
    where: { code: "MA-LEASE-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-LEASE-STANDARD-001",
      title: "Bail d'habitation standard (Loi 67-12)",
      titleAr: "عقد الكراء السكني العادي وفق القانون 67.12",
      description: "Le bail d'habitation > 30 jours exige un écrit à date certaine mais ne requiert pas impérativement un avocat.",
      ruleKind: "LEGAL_REQUIREMENT",
      jurisdiction: "MA",
      contractTypeId: types.typeResidentialLease.id,
      scope: "Baux d'habitation de droit commun",
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "MA_LAW_67_12_STANDARD_LEASE",
      legalSourceId: sources.sourceLoi6712.id,
      article: "Art. 1 & 3",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "durationMonths",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 1,
            groupIndex: 0,
            label: "Durée du bail >= 1 mois",
          },
        ],
      },
    },
  });

  // 2. High-Rent Residential Lease -> LAWYER_OPTIONAL
  const ruleLeaseHighValue = await db.legalRule.upsert({
    where: { code: "MA-LEASE-HIGH-VALUE-002" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-LEASE-HIGH-VALUE-002",
      title: "Bail d'habitation à loyer élevé (> 15 000 MAD)",
      titleAr: "كراء سكني ذو وجيبة كرائية مرتفعة (> 15 ألف درهم)",
      description: "Recommandation d'assistance juridique pour les montants locatifs élevés.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeResidentialLease.id,
      status: "VERIFIED",
      route: "LAWYER_OPTIONAL",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 50,
      reasonCode: "POLICY_HIGH_RENT_RECOMMENDS_REVIEW",
      internalPolicyRef: "POL-RENT-RISK-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "rentAmountMad",
            operator: "GREATER_THAN",
            valueNumber: 15000,
            groupIndex: 0,
            label: "Loyer mensuel > 15 000 MAD",
          },
        ],
      },
    },
  });

  // 3. Freelance Service Standard -> SELF_SERVICE
  const ruleServiceStandard = await db.legalRule.upsert({
    where: { code: "MA-SERVICE-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-SERVICE-STANDARD-001",
      title: "Prestation de services standard",
      titleAr: "تقديم خدمات عادي",
      description: "Contrat de services régi par la liberté contractuelle du DOC.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeFreelanceService.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_SERVICE_STANDARD",
      internalPolicyRef: "POL-SRV-01",
      active: true,
      createdById: adminId,
    },
  });

  // 4. IP Transfer High Value -> LAWYER_REQUIRED
  const ruleServiceIpHigh = await db.legalRule.upsert({
    where: { code: "MA-SERVICE-IP-HIGH-002" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-SERVICE-IP-HIGH-002",
      title: "Cession de droits intellectuels à valeur élevée (> 60 000 MAD)",
      titleAr: "تفويت حقوق الملكية الفكرية بمبلغ يفوق 60 ألف درهم",
      description: "La cession de droits de propriété intellectuelle à valeur significative requiert une validation par avocat.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeFreelanceService.id,
      status: "VERIFIED",
      route: "LAWYER_REQUIRED",
      lawyerReview: "REQUIRED",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 30,
      reasonCode: "POLICY_IP_TRANSFER_REQUIRES_LAWYER",
      internalPolicyRef: "POL-SRV-IP-RISK",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "ipAssignment",
            operator: "EQUALS",
            valueBoolean: true,
            groupIndex: 0,
            label: "Cession de propriété intellectuelle demandée",
          },
          {
            field: "amountMad",
            operator: "GREATER_THAN",
            valueNumber: 60000,
            groupIndex: 0,
            label: "Montant total > 60 000 MAD",
          },
        ],
      },
    },
  });

  // 5. Commercial Lease -> LAWYER_SIGNATURE_REQUIRED
  const ruleCommercialLease = await db.legalRule.upsert({
    where: { code: "MA-COMMERCIAL-LEASE-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-COMMERCIAL-LEASE-001",
      title: "Bail commercial statutaire (Loi 49-16)",
      titleAr: "عقد الكراء التجاري القانوني (القانون 49.16)",
      description: "Le statut protecteur du bail commercial implique la signature et formalisation par un avocat agréé.",
      ruleKind: "LEGAL_REQUIREMENT",
      jurisdiction: "MA",
      contractTypeId: types.typeCommercialLease.id,
      status: "VERIFIED",
      route: "LAWYER_SIGNATURE_REQUIRED",
      lawyerReview: "REQUIRED",
      lawyerSignature: "REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 20,
      reasonCode: "MA_LAW_49_16_MANDATORY_LEGAL_SIGNATURE",
      legalSourceId: sources.sourceLoi4916.id,
      article: "Art. 3",
      active: true,
      createdById: adminId,
    },
  });

  // 6. Real Estate Sale -> SPECIALIST_REQUIRED (Notary)
  const ruleRealEstate = await db.legalRule.upsert({
    where: { code: "MA-REAL-ESTATE-NOTARY-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-REAL-ESTATE-NOTARY-001",
      title: "Vente d'immeuble immatriculé (Loi 39-08 Art. 4)",
      titleAr: "بيع عقار محفّظ (المادة 4 من القانون 39.08)",
      description: "Tout acte translatif de propriété immobilière doit obligatoirement être dressé par un notaire ou avocat agréé près la Cour de Cassation.",
      ruleKind: "LEGAL_REQUIREMENT",
      jurisdiction: "MA",
      contractTypeId: types.typeRealEstateSale.id,
      status: "VERIFIED",
      route: "SPECIALIST_REQUIRED",
      lawyerReview: "NOT_REQUIRED",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: true,
      specialistType: "NOTAIRE_OU_AVOCAT_CASSATION",
      writtenContractRequired: true,
      manualReviewRequired: true,
      priority: 10,
      reasonCode: "MA_LAW_39_08_MANDATORY_AUTHENTIC_DEED",
      legalSourceId: sources.sourceLoi3908.id,
      article: "Art. 4",
      active: true,
      createdById: adminId,
    },
  });

  // 7. Mutual NDA -> SELF_SERVICE (freedom of contract, DOC).
  const ruleNdaStandard = await db.legalRule.upsert({
    where: { code: "MA-NDA-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-NDA-STANDARD-001",
      title: "Accord de confidentialité standard (one-way ou mutuel)",
      titleAr: "اتفاقية عدم إفصاح عادية (من طرف واحد أو متبادلة)",
      description:
        "L'accord de confidentialité relève de la liberté contractuelle (DOC 1913): la plate-forme exige un écrit daté mais aucun avocat n'est impératif. Policy conforme aux règles vérifiées.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeNda.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_NDA_STANDARD",
      internalPolicyRef: "POL-NDA-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "durationYears",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 1,
            groupIndex: 0,
            label: "Durée de confidentialité >= 1 an",
          },
        ],
      },
    },
  });

  // 8. Vehicle sale between individuals -> SELF_SERVICE.
  const ruleVehicleStandard = await db.legalRule.upsert({
    where: { code: "MA-VEHICLE-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-VEHICLE-STANDARD-001",
      title: "Vente de véhicule d'occasion de droit commun",
      titleAr: "بيع مركبة مستعملة وفق القانون العادي",
      description:
        "La vente d'un véhicule d'occasion se fait par acte sous seing privé (liberté contractuelle DOC). Policy de la plate-forme: mentions du certificat d'immatriculation exigées dans le questionnaire.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeVehicleSale.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_VEHICLE_STANDARD",
      internalPolicyRef: "POL-VEH-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "salePriceMad",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Tout prix de vente",
          },
        ],
      },
    },
  });

  // 9. Fixed-term employment contract -> LAWYER_REQUIRED (requalification risk).
  const ruleEmploymentCdd = await db.legalRule.upsert({
    where: { code: "MA-EMPLOYMENT-CDD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-EMPLOYMENT-CDD-001",
      title: "Contrat à durée déterminée (Code du travail)",
      titleAr: "عقد عمل محدد المدة (مدونة الشغل)",
      description:
        "Le CDD n'est licite que dans les cas prévus par la loi n° 65-99: le fondement du recours au CDD est vérifié par un professionnel, faute de quoi le contrat risque la requalification en CDI.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeEmploymentCdd.id,
      status: "VERIFIED",
      route: "LAWYER_REQUIRED",
      lawyerReview: "REQUIRED",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 40,
      reasonCode: "POLICY_CDD_REQUIRES_LAWYER",
      internalPolicyRef: "POL-EMP-CDD-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "grossMonthlySalaryMad",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Toute rémunération",
          },
        ],
      },
    },
  });

  // 10. Indefinite-term employment contract -> LAWYER_REQUIRED (Code du Travail).
  const ruleEmploymentCdi = await db.legalRule.upsert({
    where: { code: "MA-EMPLOYMENT-CDI-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-EMPLOYMENT-CDI-001",
      title: "Contrat à durée indéterminée (Code du travail 65-99)",
      titleAr: "عقد عمل غير محدد المدة (القانون 65.99)",
      description: "Le CDI est la forme normale du lien de travail: la rupture repose sur un motif légal et un préavis — un avocat vérifie les clauses de rupture.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeEmploymentCdi.id,
      status: "VERIFIED",
      route: "LAWYER_REQUIRED",
      lawyerReview: "REQUIRED",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 40,
      reasonCode: "POLICY_CDI_REQUIRES_LAWYER",
      internalPolicyRef: "POL-EMP-CDI-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "grossMonthlySalaryMad",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Toute rémunération",
          },
        ],
      },
    },
  });

  // 11. Furnished residential lease -> SELF_SERVICE.
  const ruleFurnishedLease = await db.legalRule.upsert({
    where: { code: "MA-LEASE-FURNISHED-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-LEASE-FURNISHED-001",
      title: "Bail d'habitation meublé (Loi 67-12)",
      titleAr: "كراء سكني مفروش وفق القانون 67.12",
      description: "Le bail meublé obéit au même régime que le bail vide, avocat non obligatoire.",
      ruleKind: "LEGAL_REQUIREMENT",
      jurisdiction: "MA",
      contractTypeId: types.typeFurnishedLease.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "MA_LAW_67_12_FURNISHED_LEASE",
      legalSourceId: sources.sourceLoi6712.id,
      article: "Art. 1 & 3",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "durationMonths",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 1,
            groupIndex: 0,
            label: "Durée du bail >= 1 mois",
          },
        ],
      },
    },
  });

  // 12. Seasonal lease -> SELF_SERVICE.
  const ruleSeasonalLease = await db.legalRule.upsert({
    where: { code: "MA-LEASE-SEASONAL-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-LEASE-SEASONAL-001",
      title: "Bail saisonnier / location de vacances",
      titleAr: "كراء موسم / إيجار سياحي",
      description: "Location courte durée à usage de villégiature: avocat non obligatoire.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeSeasonalLease.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_SEASONAL_LEASE_SELF_SERVICE",
      internalPolicyRef: "POL-RENT-SEASONAL-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "startDate",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Date de début renseignée",
          },
        ],
      },
    },
  });

  // 13. Loan between individuals -> SELF_SERVICE.
  const ruleLoanStandard = await db.legalRule.upsert({
    where: { code: "MA-LOAN-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-LOAN-STANDARD-001",
      title: "Prêt entre particuliers (Dahîr des Obligations et des Contrats)",
      titleAr: "قرض بين الأفراد (ظهير الالتزامات والعقود)",
      description: "Le prêt d'argent entre particuliers relève de la liberté contractuelle (DOC): avocat non obligatoire.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typeLoanAgreement.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_LOAN_STANDARD",
      internalPolicyRef: "POL-LOAN-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "loanAmountMad",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Tout montant de prêt",
          },
        ],
      },
    },
  });

  // 14. Power of attorney -> SELF_SERVICE (administrative acts only).
  const rulePowerOfAttorney = await db.legalRule.upsert({
    where: { code: "MA-POA-STANDARD-001" },
    update: { status: "VERIFIED", active: true },
    create: {
      code: "MA-POA-STANDARD-001",
      title: "Procuration administrative courante",
      titleAr: "توكيل إداري عادي",
      description: "Mandat pour actes administratifs courants: avocat non obligatoire, hors actes notariés.",
      ruleKind: "PLATFORM_POLICY",
      jurisdiction: "MA",
      contractTypeId: types.typePowerOfAttorney.id,
      status: "VERIFIED",
      route: "SELF_SERVICE",
      lawyerReview: "OPTIONAL",
      lawyerSignature: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      priority: 100,
      reasonCode: "POLICY_POA_ADMINISTRATIVE",
      internalPolicyRef: "POL-POA-01",
      active: true,
      createdById: adminId,
      conditions: {
        create: [
          {
            field: "mandatePurpose",
            operator: "GREATER_THAN_OR_EQUAL",
            valueNumber: 0,
            groupIndex: 0,
            label: "Objet du mandat renseigné",
          },
        ],
      },
    },
  });

  return {
    ruleLeaseStandard,
    ruleLeaseHighValue,
    ruleServiceStandard,
    ruleServiceIpHigh,
    ruleCommercialLease,
    ruleRealEstate,
    ruleNdaStandard,
    ruleVehicleStandard,
    ruleEmploymentCdd,
    ruleEmploymentCdi,
    ruleFurnishedLease,
    ruleSeasonalLease,
    ruleLoanStandard,
    rulePowerOfAttorney,
  };
}
