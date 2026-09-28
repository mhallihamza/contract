import type { PrismaClient } from "@prisma/client";
import { sha256 } from "../../src/lib/documents/storage";

export async function seedDemoCaseD(
  db: PrismaClient,
  typeCommercialLeaseId: string,
  client2Id: string,
  lawyerAId: string,
) {
  const refD = "MLP-2026-004";
  const contractD = await db.contract.upsert({
    where: { reference: refD },
    update: {},
    create: {
      reference: refD,
      clientId: client2Id,
      contractTypeId: typeCommercialLeaseId,
      title: "Bail commercial local Tanger Med",
      language: "FR",
      jurisdiction: "MA",
      status: "SIGNATURE_PENDING",
      route: "LAWYER_SIGNATURE_REQUIRED",
      intentCode: "COMMERCIAL_LEASE",
      intentConfidence: 0.98,
      rawIntentText: "Bail commercial pour un entrepôt à Tanger Med soumis à la loi 49-16",
      summaryFr: "Bail commercial statutaire régi par la loi 49-16. Signature d'avocat obligatoire.",
      summaryAr: "كراء تجاري خاضع للقانون 49.16. يستوجب توقيع ومصادقة محامٍ مقبول.",
      priceAmount: 1430.0, // 1190 lawyer + 240 signature
      priceCurrency: "MAD",
      assignedLawyerId: lawyerAId,
      routedAt: new Date("2026-09-24"),
      paymentConfirmedAt: new Date("2026-09-24"),
    },
  });

  const versionD = await db.contractVersion.upsert({
    where: { contractId_versionNumber: { contractId: contractD.id, versionNumber: 2 } },
    update: {},
    create: {
      contractId: contractD.id,
      versionNumber: 2,
      kind: "VALIDATED",
      content: "Contrat de bail commercial Loi 49-16 validé par Me. Karim El Fassi. En attente d'apposition de signature électronique.",
      createdById: lawyerAId,
      changeSummary: "Contrat révisé et validé par l'avocat. Cérémonie de signature requise.",
    },
  });

  await db.contract.update({
    where: { id: contractD.id },
    data: { currentVersionId: versionD.id },
  });

  const docD = await db.contractDocument.create({
    data: {
      contractId: contractD.id,
      contractVersionId: versionD.id,
      ownerId: client2Id,
      uploadedById: lawyerAId,
      documentType: "LAWYER_REVISED_DRAFT",
      filename: `${contractD.reference}_valide_pour_signature.docx`,
      storageProvider: "local",
      storagePath: `contracts/${contractD.id}/validated.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 24300,
      checksum: sha256(versionD.content),
      version: 2,
      immutable: false,
    },
  });

  const lawyerReqD = await db.lawyerRequest.upsert({
    where: { contractId: contractD.id },
    update: {},
    create: {
      contractId: contractD.id,
      clientId: client2Id,
      lawyerId: lawyerAId,
      draftVersionId: versionD.id,
      serviceType: "LAWYER_REQUIRED_SERVICE",
      status: "SIGNATURE_PENDING",
      requiresSignature: true,
      validatedAt: new Date("2026-09-25"),
      validatedById: lawyerAId,
      signatureRequiredAt: new Date("2026-09-25"),
      aiSummary: "Bail commercial soumis à la loi 49-16. L'acte exige la signature d'un avocat agréé.",
      reviewAreas: ["Conformité avec les dispositions impératives de la loi 49-16"],
    },
  });

  await db.signatureRequest.create({
    data: {
      contractId: contractD.id,
      lawyerRequestId: lawyerReqD.id,
      documentId: docD.id,
      contractVersionId: versionD.id,
      signerUserId: lawyerAId,
      provider: "mock",
      method: "MOCK_SANDBOX",
      providerRequestId: `mocksig_${contractD.reference}`,
      status: "SENT",
    },
  });

  await db.payment.create({
    data: {
      userId: client2Id,
      contractId: contractD.id,
      lawyerRequestId: lawyerReqD.id,
      amount: 1430.0,
      currency: "MAD",
      provider: "mock",
      providerPaymentId: `mock_pay_${contractD.reference}`,
      status: "PAID",
      type: "LAWYER_REQUIRED_SERVICE",
      paidAt: new Date("2026-09-24"),
    },
  });

  return contractD;
}
