import { randomUUID } from "node:crypto";
import type { SignatureMethod, SignatureRequest, UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { LOG_EVENTS, logger } from "@/lib/logging";
import { assertLawyerRequestTransition, assertTransition } from "@/lib/contracts/state-machine";
import { getSignatureProvider } from "./provider";
import type { SignatureCertificate, SignatureRequestPayload } from "./types";
import { sha256 } from "@/lib/documents/storage";

export interface RequestLawyerSignatureParams {
  contractId: string;
  lawyerRequestId: string;
  lawyerUserId: string;
  actorRole: UserRole;
  locale?: "fr" | "ar";
}

export interface RequestLawyerSignatureOutcome {
  signatureRequest: SignatureRequest;
  providerRequestId: string;
  method: SignatureMethod;
  signingUrl: string | null;
}

/**
 * Creates a formal electronic signature request for a contract that has been
 * validated internally by an assigned lawyer (§22).
 *
 * Distinct operations:
 * - Internal review validation: Lawyer validates draft content (state: VALIDATED).
 * - Electronic signature ceremony: Signer ceremony created, logged separately.
 */
export async function createContractSignatureRequest(
  params: RequestLawyerSignatureParams,
): Promise<RequestLawyerSignatureOutcome> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: {
      currentVersion: true,
      documents: { orderBy: { createdAt: "desc" }, take: 1 },
      lawyerRequest: true,
    },
  });

  const lawyerUser = await db.user.findUniqueOrThrow({
    where: { id: params.lawyerUserId },
  });

  if (!contract.currentVersion) {
    throw new Error("CONTRACT_HAS_NO_VERSION");
  }

  const latestDoc = contract.documents[0];
  if (!latestDoc) {
    throw new Error("CONTRACT_HAS_NO_DOCUMENT_TO_SIGN");
  }

  // Check state machine validity
  assertTransition(contract.status, "SIGNATURE_PENDING");
  if (contract.lawyerRequest) {
    assertLawyerRequestTransition(contract.lawyerRequest.status, "SIGNATURE_PENDING");
  }

  const provider = getSignatureProvider();
  const payload: SignatureRequestPayload = {
    contractId: contract.id,
    contractVersionId: contract.currentVersion.id,
    documentId: latestDoc.id,
    documentChecksum: latestDoc.checksum,
    documentFilename: latestDoc.filename,
    signerUserId: lawyerUser.id,
    signerFullName: lawyerUser.fullName,
    signerEmail: lawyerUser.email,
    locale: params.locale ?? "fr",
    reason: `Signature d'avocat pour le contrat ${contract.reference}`,
  };

  const created = await provider.createSignatureRequest(payload);

  const signatureRequest = await db.$transaction(async (tx) => {
    const sigReq = await tx.signatureRequest.create({
      data: {
        id: randomUUID(),
        contractId: contract.id,
        lawyerRequestId: params.lawyerRequestId,
        documentId: latestDoc.id,
        contractVersionId: contract.currentVersion!.id,
        signerUserId: lawyerUser.id,
        provider: provider.name,
        method: created.method,
        providerRequestId: created.providerRequestId,
        status: created.status,
      },
    });

    await tx.contract.update({
      where: { id: contract.id },
      data: { status: "SIGNATURE_PENDING" },
    });

    if (contract.lawyerRequest) {
      await tx.lawyerRequest.update({
        where: { id: contract.lawyerRequest.id },
        data: {
          status: "SIGNATURE_PENDING",
          signatureRequiredAt: new Date(),
        },
      });
    }

    return sigReq;
  });

  logger.info(LOG_EVENTS.signatureEvent, {
    contractId: contract.id,
    signatureRequestId: signatureRequest.id,
    providerRequestId: created.providerRequestId,
    status: created.status,
  });

  await recordAudit({
    action: "SIGNATURE_REQUESTED",
    entityType: "SignatureRequest",
    entityId: signatureRequest.id,
    actorId: params.lawyerUserId,
    actorRole: params.actorRole,
    metadata: {
      contractId: contract.id,
      provider: provider.name,
      method: created.method,
      providerRequestId: created.providerRequestId,
    },
  });

  return {
    signatureRequest,
    providerRequestId: created.providerRequestId,
    method: created.method,
    signingUrl: created.signingUrl,
  };
}

export interface CompleteLawyerSignatureParams {
  signatureRequestId: string;
  actorUserId: string;
  actorRole: UserRole;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface CompleteLawyerSignatureOutcome {
  signatureRequest: SignatureRequest;
  certificate: SignatureCertificate;
}

/**
 * Completes the electronic signature ceremony for an assigned lawyer.
 * Updates the contract to SIGNED -> ready for FINAL.
 */
export async function completeContractSignature(
  params: CompleteLawyerSignatureParams,
): Promise<CompleteLawyerSignatureOutcome> {
  const sigReq = await db.signatureRequest.findUniqueOrThrow({
    where: { id: params.signatureRequestId },
    include: {
      contract: { include: { currentVersion: true } },
      lawyerRequest: true,
      signer: true,
    },
  });

  if (sigReq.status === "SIGNED") {
    throw new Error("SIGNATURE_ALREADY_COMPLETED");
  }

  const contract = sigReq.contract;
  assertTransition(contract.status, "SIGNED");
  if (sigReq.lawyerRequest) {
    assertLawyerRequestTransition(sigReq.lawyerRequest.status, "SIGNED");
  }

  const documentBytes = Buffer.from(contract.currentVersion?.content ?? "", "utf-8");
  const signedDocChecksum = sha256(documentBytes);

  const provider = getSignatureProvider();
  const payload: SignatureRequestPayload = {
    contractId: contract.id,
    contractVersionId: sigReq.contractVersionId ?? contract.currentVersion!.id,
    documentId: sigReq.documentId ?? randomUUID(),
    documentChecksum: signedDocChecksum,
    documentFilename: `${contract.reference}_signed.pdf`,
    signerUserId: sigReq.signer.id,
    signerFullName: sigReq.signer.fullName,
    signerEmail: sigReq.signer.email,
    locale: contract.language.toLowerCase() as "fr" | "ar",
    reason: `Signature électronique par ${sigReq.signer.fullName}`,
  };

  const certificate = await provider.completeSignature(payload, {
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    signedDocumentChecksum: signedDocChecksum,
  });

  const updatedReq = await db.$transaction(async (tx) => {
    const updated = await tx.signatureRequest.update({
      where: { id: sigReq.id },
      data: {
        status: "SIGNED",
        signedAt: certificate.signedAt,
        verificationMetadata: certificate.verificationMetadata as never,
      },
    });

    await tx.contract.update({
      where: { id: contract.id },
      data: { status: "SIGNED" },
    });

    if (sigReq.lawyerRequest) {
      await tx.lawyerRequest.update({
        where: { id: sigReq.lawyerRequest.id },
        data: {
          status: "SIGNED",
          signedAt: certificate.signedAt,
        },
      });
    }

    return updated;
  });

  logger.info(LOG_EVENTS.signatureEvent, {
    contractId: contract.id,
    signatureRequestId: sigReq.id,
    status: "SIGNED",
  });

  await recordAudit({
    action: "SIGNATURE_COMPLETED",
    entityType: "SignatureRequest",
    entityId: sigReq.id,
    actorId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: {
      contractId: contract.id,
      signedAt: certificate.signedAt.toISOString(),
      signedChecksum: signedDocChecksum,
    },
  });

  return {
    signatureRequest: updatedReq,
    certificate,
  };
}

