import { randomUUID } from "node:crypto";
import type { SignatureMethod, SignatureRequestStatus } from "@prisma/client";
import type {
  SignatureCertificate,
  SignatureCreated,
  SignatureProvider,
  SignatureRequestPayload,
  SignatureStatus,
} from "./types";

/**
 * Mock sandbox signature provider (§22, §47).
 *
 * Explicitly uncertified test provider: produces clear metadata stating
 * that the signature was generated in test mode and does not constitute
 * a qualified electronic signature under Moroccan legal standards.
 */
export class MockSignatureProvider implements SignatureProvider {
  readonly name = "mock";
  readonly method: SignatureMethod = "MOCK_SANDBOX";
  readonly qualified = false;

  private readonly requests = new Map<string, { status: SignatureRequestStatus; signedAt: Date | null }>();

  async createSignatureRequest(payload: SignatureRequestPayload): Promise<SignatureCreated> {
    const providerRequestId = `mocksig_${randomUUID()}`;
    this.requests.set(providerRequestId, { status: "SENT", signedAt: null });
    return {
      providerRequestId,
      status: "SENT",
      signingUrl: `/lawyer/requests/${payload.contractId}/sign`,
      method: this.method,
      instructionsFr:
        "Signature en environnement de test : la cérémonie est enregistrée côté plateforme avec l'identité du signataire, l'horodatage et l'empreinte du document. Elle n'a pas la valeur d'une signature électronique qualifiée.",
      instructionsAr:
        "توقيع في بيئة اختبار: تُسجَّل العملية على مستوى المنصة مع هوية الموقّع والطابع الزمني وبصمة الوثيقة. ولا تعادل توقيعاً إلكترونياً مؤهلاً.",
    };
  }

  async getSignatureStatus(providerRequestId: string): Promise<SignatureStatus> {
    const entry = this.requests.get(providerRequestId);
    return {
      providerRequestId,
      status: entry?.status ?? "FAILED",
      signedAt: entry?.signedAt ?? null,
      verificationMetadata: entry
        ? { provider: this.name, method: this.method, sandbox: true }
        : { provider: this.name, error: "UNKNOWN_REQUEST" },
    };
  }

  async cancelSignatureRequest(providerRequestId: string): Promise<{ ok: boolean }> {
    const entry = this.requests.get(providerRequestId);
    if (!entry) return { ok: false };
    entry.status = "CANCELLED";
    return { ok: true };
  }

  async downloadSignedDocument(): Promise<{ bytes: Buffer; mimeType: string; filename: string } | null> {
    return null;
  }

  async completeSignature(
    payload: SignatureRequestPayload,
    context: { ipAddress: string | null; userAgent: string | null; signedDocumentChecksum: string },
  ): Promise<SignatureCertificate> {
    const signedAt = new Date();
    const providerRequestId = payload.documentId ? `mocksig_${payload.documentId}` : `mocksig_${randomUUID()}`;

    const certificate: SignatureCertificate = {
      providerRequestId,
      method: this.method,
      signerName: payload.signerFullName,
      signerEmail: payload.signerEmail,
      signedAt,
      signedDocumentChecksum: context.signedDocumentChecksum,
      statementFr:
        "Signature apposée par l'avocat via la cérémonie de signature en environnement de test de la plateforme (non qualifiée).",
      statementAr:
        "تم التوقيع من طرف المحامي عبر آلية التوقيع في بيئة الاختبار بالمنصة (غير مؤهل).",
      verificationMetadata: {
        provider: this.name,
        method: this.method,
        qualified: false,
        sandbox: true,
        signerUserId: payload.signerUserId,
        signerEmail: payload.signerEmail,
        signedAt: signedAt.toISOString(),
        documentChecksum: payload.documentChecksum,
        signedContentChecksum: context.signedDocumentChecksum,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    };

    this.requests.set(providerRequestId, { status: "SIGNED", signedAt });
    return certificate;
  }
}

let cached: SignatureProvider | null = null;

export function getSignatureProvider(): SignatureProvider {
  if (cached) return cached;
  cached = new MockSignatureProvider();
  return cached;
}

export function setSignatureProviderForTesting(provider: SignatureProvider | null): void {
  cached = provider;
}
