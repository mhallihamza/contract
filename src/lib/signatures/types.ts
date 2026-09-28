import type { SignatureMethod, SignatureRequestStatus } from "@prisma/client";

/**
 * Electronic signature provider types (§22).
 *
 * Distinct operations:
 * - INTERNAL_VALIDATION: lawyer reviewed and approved content
 * - ELECTRONIC_SIGNATURE: ceremony recorded with signer identity and certificate
 */
export interface SignatureRequestPayload {
  contractId: string;
  contractVersionId: string;
  documentId: string;
  documentChecksum: string;
  documentFilename: string;
  signerUserId: string;
  signerFullName: string;
  signerEmail: string;
  locale: "fr" | "ar";
  reason: string;
}

export interface SignatureCreated {
  providerRequestId: string;
  status: SignatureRequestStatus;
  signingUrl: string | null;
  method: SignatureMethod;
  instructionsFr: string;
  instructionsAr: string;
}

export interface SignatureStatus {
  providerRequestId: string;
  status: SignatureRequestStatus;
  signedAt: Date | null;
  verificationMetadata: Record<string, unknown> | null;
}

export interface SignatureCertificate {
  providerRequestId: string;
  method: SignatureMethod;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  signedDocumentChecksum: string;
  statementFr: string;
  statementAr: string;
  verificationMetadata: Record<string, unknown>;
}

export interface SignatureProvider {
  readonly name: string;
  readonly method: SignatureMethod;
  readonly qualified: boolean;
  createSignatureRequest(payload: SignatureRequestPayload): Promise<SignatureCreated>;
  getSignatureStatus(providerRequestId: string): Promise<SignatureStatus>;
  cancelSignatureRequest(providerRequestId: string): Promise<{ ok: boolean }>;
  downloadSignedDocument(providerRequestId: string): Promise<{ bytes: Buffer; mimeType: string; filename: string } | null>;
  completeSignature(
    payload: SignatureRequestPayload,
    context: { ipAddress: string | null; userAgent: string | null; signedDocumentChecksum: string },
  ): Promise<SignatureCertificate>;
}
