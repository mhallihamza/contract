import type { PrismaClient } from "@prisma/client";

export async function seedDemoCaseC(
  db: PrismaClient,
  typeFreelanceServiceId: string,
  client2Id: string,
) {
  const refC = "WQC-2026-003";
  const contractC = await db.contract.upsert({
    where: { reference: refC },
    update: {},
    create: {
      reference: refC,
      clientId: client2Id,
      contractTypeId: typeFreelanceServiceId,
      title: "Développement plateforme e-commerce & Cession PI",
      language: "FR",
      jurisdiction: "MA",
      status: "PAYMENT_REQUIRED",
      route: "LAWYER_REQUIRED",
      intentCode: "FREELANCE_SERVICE",
      intentConfidence: 0.91,
      rawIntentText: "Je suis une entreprise et je contractualise un développeur freelance pour 75000 DH avec cession totale des droits de propriété intellectuelle",
      summaryFr: "Contrat de développement logiciel avec cession complète de droits d'auteur pour 75 000 MAD.",
      summaryAr: "عقد تطوير برمجيات مع تفويت شامل لحقوق الملكية الفكرية بمبلغ 75000 درهم.",
      priceAmount: 1190.0,
      priceCurrency: "MAD",
      routedAt: new Date("2026-09-25"),
    },
  });

  const fieldsC = [
    { key: "serviceDescription", valueText: "Développement backend & frontend d'une plateforme de commerce électronique" },
    { key: "amountMad", valueNumber: 75000 },
    { key: "ipAssignment", valueBoolean: true },
    { key: "confidentialityIncluded", valueBoolean: true },
    { key: "startDate", valueDate: new Date("2026-10-15") },
  ];
  for (const f of fieldsC) {
    await db.contractField.upsert({
      where: { contractId_key: { contractId: contractC.id, key: f.key } },
      update: {},
      create: { contractId: contractC.id, ...f },
    });
  }

  await db.routingDecision.create({
    data: {
      contractId: contractC.id,
      route: "LAWYER_REQUIRED",
      lawyerReviewRequirement: "REQUIRED",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      reason: "La cession de droits de propriété intellectuelle pour un montant > 60 000 MAD requiert obligatoirement la validation d'un avocat selon la politique de risque configurée.",
      reasonCodes: ["POLICY_IP_TRANSFER_REQUIRES_LAWYER", "LEGAL_REQUIREMENT_APPLIED"],
      matchedRuleIds: [],
      legalSourceIds: [],
      engineVersion: "routing-engine/1.0.0",
      ruleSnapshot: { engine: "1.0.0", rule: "POLICY_IP_TRANSFER_REQUIRES_LAWYER" },
      status: "CONFIRMED",
    },
  });

  return contractC;
}
