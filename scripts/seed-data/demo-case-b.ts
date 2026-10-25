import type { PrismaClient } from "@prisma/client";

export async function seedDemoCaseB(
  db: PrismaClient,
  typeResidentialLeaseId: string,
  versionLeaseId: string,
  client1Id: string,
  lawyerAId: string,
) {
  const refB = "WQC-2026-002";
  const contractB = await db.contract.upsert({
    where: { reference: refB },
    update: {},
    create: {
      reference: refB,
      clientId: client1Id,
      contractTypeId: typeResidentialLeaseId,
      templateVersionId: versionLeaseId,
      title: "Bail résidentiel Villa Californie - Revue demandée",
      language: "FR",
      jurisdiction: "MA",
      status: "LAWYER_REVIEW",
      route: "LAWYER_OPTIONAL",
      intentCode: "RENT_RESIDENTIAL_PROPERTY",
      intentConfidence: 0.96,
      rawIntentText: "Je loue une villa meublée à Californie 25000 DH par mois avec 2 mois de caution",
      summaryFr: "Location d'une villa meublée à Casablanca Californie, 25 000 MAD/mois. Revue par avocat choisie.",
      summaryAr: "كراء فيلا مفروشة بالدار البيضاء بمبلغ 25000 درهم شهرياً. تم اختيار مراجعة المحامي.",
      priceAmount: 890.0,
      priceCurrency: "MAD",
      assignedLawyerId: lawyerAId,
      routedAt: new Date("2026-09-22"),
      paymentConfirmedAt: new Date("2026-09-22"),
    },
  });

  await db.contractParty.upsert({
    where: { contractId_role_fullName: { contractId: contractB.id, role: "LANDLORD", fullName: "Mehdi Alami" } },
    update: {},
    create: {
      contractId: contractB.id,
      role: "LANDLORD",
      partyType: "INDIVIDUAL",
      fullName: "Mehdi Alami",
      nationalId: "BK678901",
      city: "Casablanca",
      isUser: true,
      userId: client1Id,
    },
  });

  await db.contractParty.upsert({
    where: { contractId_role_fullName: { contractId: contractB.id, role: "TENANT", fullName: "Société Finance Plus SA" } },
    update: {},
    create: {
      contractId: contractB.id,
      role: "TENANT",
      partyType: "COMPANY",
      fullName: "Société Finance Plus SA",
      companyName: "Société Finance Plus SA",
      companyTaxId: "ICE-0019283740001",
      representative: "M. Khalid Idrissi (DG)",
      city: "Casablanca",
    },
  });

  const fieldsB = [
    { key: "propertyAddress", valueText: "Villa 12, Rue des Eucalyptus, Californie" },
    { key: "propertyCity", valueText: "Casablanca" },
    { key: "durationMonths", valueNumber: 24 },
    { key: "startDate", valueDate: new Date("2026-11-01") },
    { key: "rentAmountMad", valueNumber: 25000 },
    { key: "securityDepositMad", valueNumber: 50000 },
    { key: "furnished", valueBoolean: true },
  ];
  for (const f of fieldsB) {
    await db.contractField.upsert({
      where: { contractId_key: { contractId: contractB.id, key: f.key } },
      update: {},
      create: { contractId: contractB.id, ...f },
    });
  }

  const draftVersionB = await db.contractVersion.upsert({
    where: { contractId_versionNumber: { contractId: contractB.id, versionNumber: 1 } },
    update: {},
    create: {
      contractId: contractB.id,
      versionNumber: 1,
      kind: "AI_DRAFT",
      content: "Projet de bail villa meublée Californie soumis à la revue de l'avocat assigné...",
      templateVersionId: versionLeaseId,
      createdById: client1Id,
      changeSummary: "Projet initial généré et transmis pour revue d'avocat.",
    },
  });

  await db.contract.update({
    where: { id: contractB.id },
    data: { currentVersionId: draftVersionB.id },
  });

  const lawyerReqB = await db.lawyerRequest.upsert({
    where: { contractId: contractB.id },
    update: {},
    create: {
      contractId: contractB.id,
      clientId: client1Id,
      lawyerId: lawyerAId,
      draftVersionId: draftVersionB.id,
      serviceType: "LAWYER_REVIEW",
      status: "UNDER_REVIEW",
      requiresSignature: false,
      acceptedAt: new Date("2026-09-22"),
      aiSummary: "Bail de villa meublée à loyer significatif (25 000 MAD/mois) au profit d'une personne morale.",
      reviewAreas: [
        "Vérifier les pouvoirs du représentant de la personne morale locataire",
        "Clause d'indexation du loyer selon la loi 07-03",
        "Inventaire détaillé du mobilier annexé au bail (meublé)",
      ],
      missingInformation: ["Copie de la délégation de signature du DG de la société locataire"],
    },
  });

  await db.lawyerAssignment.create({
    data: {
      lawyerRequestId: lawyerReqB.id,
      lawyerId: lawyerAId,
      status: "ACCEPTED",
      assignmentReason: "Attribution automatique par spécialité RENTAL, bilingue FR/AR, charge 2/10",
      workloadAtAssignment: 2,
      maxConcurrentAtAssignment: 10,
      respondedAt: new Date("2026-09-22"),
    },
  });

  await db.payment.create({
    data: {
      userId: client1Id,
      contractId: contractB.id,
      lawyerRequestId: lawyerReqB.id,
      amount: 890.0,
      currency: "MAD",
      provider: "mock",
      providerPaymentId: `mock_pay_${contractB.reference}`,
      status: "PAID",
      type: "LAWYER_REVIEW",
      paidAt: new Date("2026-09-22"),
    },
  });

  return contractB;
}
