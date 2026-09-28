import type { PrismaClient } from "@prisma/client";
import { sha256 } from "../../src/lib/documents/storage";

export async function seedDemoCaseA(
  db: PrismaClient,
  typeResidentialLeaseId: string,
  versionLeaseId: string,
  sourceLoi6712Id: string,
  ruleLeaseStandardId: string,
  client1Id: string,
) {
  const refA = "MLP-2026-001";
  const contractA = await db.contract.upsert({
    where: { reference: refA },
    update: {},
    create: {
      reference: refA,
      clientId: client1Id,
      contractTypeId: typeResidentialLeaseId,
      templateVersionId: versionLeaseId,
      title: "Contrat de location résidentielle - Casablanca Anfa",
      language: "FR",
      jurisdiction: "MA",
      status: "FINAL",
      route: "SELF_SERVICE",
      intentCode: "RENT_RESIDENTIAL_PROPERTY",
      intentConfidence: 0.94,
      rawIntentText: "Je veux louer mon appartement à Casablanca pour un an à 6000 DH",
      summaryFr: "Location résidentielle d'un an à Casablanca à 6 000 MAD/mois.",
      summaryAr: "كراء شقة سكنية بالدار البيضاء لمدة عام بمبلغ 6000 درهم شهرياً.",
      priceAmount: 149.0,
      priceCurrency: "MAD",
      routedAt: new Date("2026-09-20"),
      paymentConfirmedAt: new Date("2026-09-20"),
      finalizedAt: new Date("2026-09-20"),
    },
  });

  await db.contractParty.upsert({
    where: { contractId_role_fullName: { contractId: contractA.id, role: "LANDLORD", fullName: "Mehdi Alami" } },
    update: {},
    create: {
      contractId: contractA.id,
      role: "LANDLORD",
      partyType: "INDIVIDUAL",
      fullName: "Mehdi Alami",
      nationalId: "BK678901",
      address: "14 Boulevard d'Anfa",
      city: "Casablanca",
      isUser: true,
      userId: client1Id,
    },
  });

  await db.contractParty.upsert({
    where: { contractId_role_fullName: { contractId: contractA.id, role: "TENANT", fullName: "Omar Kettani" } },
    update: {},
    create: {
      contractId: contractA.id,
      role: "TENANT",
      partyType: "INDIVIDUAL",
      fullName: "Omar Kettani",
      nationalId: "BE998877",
      address: "Casablanca",
      city: "Casablanca",
    },
  });

  const fieldsA = [
    { key: "propertyAddress", valueText: "14 Boulevard d'Anfa, 3ème étage" },
    { key: "propertyCity", valueText: "Casablanca" },
    { key: "durationMonths", valueNumber: 12 },
    { key: "startDate", valueDate: new Date("2026-10-01") },
    { key: "rentAmountMad", valueNumber: 6000 },
    { key: "securityDepositMad", valueNumber: 12000 },
  ];
  for (const f of fieldsA) {
    await db.contractField.upsert({
      where: { contractId_key: { contractId: contractA.id, key: f.key } },
      update: {},
      create: { contractId: contractA.id, ...f },
    });
  }

  const contentA = `CONTRAT DE BAIL D'HABITATION (LOI 67-12)
Réf: ${contractA.reference}

1. Préambule et désignation des parties
Entre Mehdi Alami (Bailleur) et Omar Kettani (Preneur).
2. Objet du bail
Appartement situé au 14 Boulevard d'Anfa, 3ème étage, Casablanca.
3. Durée du bail
12 mois ferme commençant le 01/10/2026.
4. Loyer
6 000 MAD par mois payable d'avance le 1er du mois.
5. Dépôt de garantie
12 000 MAD (2 mois de loyer).`;

  const versionA = await db.contractVersion.upsert({
    where: { contractId_versionNumber: { contractId: contractA.id, versionNumber: 1 } },
    update: {},
    create: {
      contractId: contractA.id,
      versionNumber: 1,
      kind: "FINAL",
      content: contentA,
      templateVersionId: versionLeaseId,
      createdById: client1Id,
      immutable: true,
      changeSummary: "Version finale préparée en libre-service.",
    },
  });

  await db.contract.update({
    where: { id: contractA.id },
    data: { currentVersionId: versionA.id },
  });

  await db.contractDocument.create({
    data: {
      contractId: contractA.id,
      contractVersionId: versionA.id,
      ownerId: client1Id,
      documentType: "FINAL_CONTRACT",
      filename: `${contractA.reference}_contrat_final.docx`,
      storageProvider: "local",
      storagePath: `contracts/${contractA.id}/final.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 18450,
      checksum: sha256(contentA),
      version: 1,
      immutable: true,
    },
  });

  await db.payment.create({
    data: {
      userId: client1Id,
      contractId: contractA.id,
      amount: 149.0,
      currency: "MAD",
      provider: "mock",
      providerPaymentId: `mock_pay_${contractA.reference}`,
      status: "PAID",
      type: "SELF_SERVICE_CONTRACT",
      paidAt: new Date("2026-09-20"),
    },
  });

  await db.routingDecision.create({
    data: {
      contractId: contractA.id,
      route: "SELF_SERVICE",
      lawyerReviewRequirement: "NOT_REQUIRED",
      lawyerSignatureRequirement: "NOT_REQUIRED",
      specialistRequired: false,
      writtenContractRequired: true,
      manualReviewRequired: false,
      reason: "Bail d'habitation standard < 15 000 MAD préparé directement en autonomie conformément à la Loi 67-12.",
      reasonCodes: ["MA_LAW_67_12_STANDARD_LEASE", "WRITTEN_CONTRACT_REQUIRED"],
      matchedRuleIds: [ruleLeaseStandardId],
      legalSourceIds: [sourceLoi6712Id],
      engineVersion: "routing-engine/1.0.0",
      ruleSnapshot: { engine: "1.0.0", verified: true },
      status: "CONFIRMED",
    },
  });

  return contractA;
}
