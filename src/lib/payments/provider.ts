import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PaymentStatus, PaymentType } from "@prisma/client";

/**
 * Payment provider abstraction (§26).
 *
 * Business logic never talks to a provider SDK directly: it talks to this
 * interface. A settlement is only ever accepted after server-side verification
 * of the payload signature and of the amount (§38) — a browser can never mark a
 * payment as paid.
 */
export interface PaymentIntent {
  paymentId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  reference: string;
  customerEmail: string;
  description: string;
}

export interface PaymentInitiation {
  providerPaymentId: string;
  status: PaymentStatus;
  redirectUrl: string | null;
  instructionsFr: string;
  instructionsAr: string;
}

export interface SettlementResult {
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  externalEventId: string;
  failureReason?: string;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  /** True when no real money can move — surfaced verbatim in the UI. */
  readonly simulated: boolean;
  createCheckout(intent: PaymentIntent): Promise<PaymentInitiation>;
  /** Verifies a provider callback. Returns false for a bad/absent signature. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
  /** Parses a verified callback into a settlement result. */
  parseSettlement(rawBody: string): SettlementResult;
}

function hmac(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Development provider.
 *
 * It is deliberately explicit: it never claims a charge happened, it exposes the
 * settlement as an HMAC-signed callback (so the verification code path is the
 * same one a real provider would use), and it is labelled as simulated in every
 * screen that mentions it (§47).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly simulated = true;
  private readonly secret: string;

  constructor(secret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET?.trim() || "dev-mock-payment-secret") {
    this.secret = secret;
  }

  async createCheckout(intent: PaymentIntent): Promise<PaymentInitiation> {
    return {
      providerPaymentId: `mock_${randomUUID()}`,
      status: "PENDING",
      redirectUrl: null,
      instructionsFr: `Prestataire simulé : la confirmation est reproduite par le point d'entrée de règlement (${intent.reference}). Aucun débit réel.`,
      instructionsAr: `مزود محاكى: يُحاكى التأكيد عبر نقطة تسوية الأداء (${intent.reference}). لا خصم حقيقي.`,
    };
  }

  verifyWebhook(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    return safeCompare(hmac(this.secret, rawBody), signature);
  }

  parseSettlement(rawBody: string): SettlementResult {
    const payload = JSON.parse(rawBody) as {
      providerPaymentId?: string;
      amount?: number;
      currency?: string;
      status?: string;
      eventId?: string;
      failureReason?: string;
    };
    const status: PaymentStatus =
      payload.status === "PAID" ? "PAID"
      : payload.status === "AUTHORIZED" ? "AUTHORIZED"
      : payload.status === "CANCELLED" ? "CANCELLED"
      : payload.status === "REFUNDED" ? "REFUNDED"
      : payload.status === "FAILED" ? "FAILED"
      : "PENDING";
    return {
      providerPaymentId: String(payload.providerPaymentId ?? ""),
      status,
      amount: Number(payload.amount ?? 0),
      currency: String(payload.currency ?? "MAD"),
      externalEventId: String(payload.eventId ?? `mock_evt_${randomUUID()}`),
      failureReason: payload.failureReason,
      raw: payload as Record<string, unknown>,
    };
  }

  /** Helper used by the demo settlement endpoint to sign the callback body. */
  sign(rawBody: string): string {
    return hmac(this.secret, rawBody);
  }
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  // Only the mock provider ships with the MVP. A production Moroccan provider
  // (CMI, Payzone, …) is added by implementing this interface — no business
  // logic changes are required (§26, §60).
  cached = new MockPaymentProvider();
  return cached;
}

export function setPaymentProviderForTesting(provider: PaymentProvider | null): void {
  cached = provider;
}
