import { randomUUID } from "node:crypto";
import type { Payment, PaymentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { LOG_EVENTS, logger } from "@/lib/logging";
import { assertTransition } from "@/lib/contracts/state-machine";
import { getPaymentProvider, MockPaymentProvider, type PaymentIntent, type PaymentInitiation, type SettlementResult } from "./provider";
import { applyVat, quoteService, type PriceQuote, type PriceQuoteInput } from "./pricing";
import { markVerificationContractPaid } from "@/lib/verification/service";
import { issueInvoiceForPayment } from "./invoice";

export interface InitiatePaymentParams {
  contractId: string;
  /** Null for an anonymous (guest) case — the payment belongs to the contract. */
  userId: string | null;
  actorRole: UserRole | null;
  userEmail: string;
  /** Prebuilt quote — used by journeys that bypass routing (verification, §8b). */
  quote?: PriceQuote;
  quoteInput?: PriceQuoteInput;
  /**
   * IMMEDIATE (default): the checkout capture closes the sale.
   * ON_VALIDATION: the provider only secures a hold; the funds are captured
   * after the lawyer validates the case (product rule 4 — the lawyer tier is
   * never cashed for work nobody validated).
   */
  captureMode?: "IMMEDIATE" | "ON_VALIDATION";
  idempotencyKey?: string;
}

export interface InitiatePaymentOutcome {
  payment: Payment;
  initiation: PaymentInitiation;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentOutcome> {
  const quote = params.quote ?? quoteService(params.quoteInput ?? {
    route: "ROUTING_UNDETERMINED",
    lawyerServiceSelected: false,
    signatureRequired: false,
  });
  if (!quote.payable || !quote.type) {
    throw new Error(`CONTRACT_NOT_PAYABLE: ${quote.reason}`);
  }

  // The checkout charges the tax-inclusive total; the HT quote lines and the
  // applied VAT are kept in the payment metadata for the invoice (§5).
  const vat = applyVat(quote).vat ?? null;
  const charged = vat ? vat.total : quote.amount;

  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true },
  });

  if (contract.status !== "PAYMENT_REQUIRED" && contract.status !== "ROUTED") {
    throw new Error(`INVALID_CONTRACT_STATUS_FOR_PAYMENT: ${contract.status}`);
  }

  const provider = getPaymentProvider();
  const paymentId = randomUUID();

  const intent: PaymentIntent = {
    paymentId,
    amount: charged,
    currency: quote.currency,
    type: quote.type,
    reference: contract.reference,
    customerEmail: params.userEmail,
    description: quote.reason,
  };

  const initiation = await provider.createCheckout(intent);

  const payment = await db.payment.create({
    data: {
      id: paymentId,
      userId: params.userId,
      contractId: contract.id,
      lawyerRequestId: contract.lawyerRequest?.id ?? null,
      amount: charged,
      currency: quote.currency,
      provider: provider.name,
      providerPaymentId: initiation.providerPaymentId,
      status: initiation.status,
      type: quote.type,
      idempotencyKey: params.idempotencyKey ?? randomUUID(),
      metadata: {
        lines: quote.lines as unknown as object,
        vat: vat ? (vat as unknown as object) : undefined,
        captureMode: params.captureMode ?? "IMMEDIATE",
        simulated: provider.simulated,
        initiationInstructionsFr: initiation.instructionsFr,
        initiationInstructionsAr: initiation.instructionsAr,
      },
    },
  });

  if (contract.status === "ROUTED") {
    assertTransition("ROUTED", "PAYMENT_REQUIRED");
    await db.contract.update({
      where: { id: contract.id },
      data: { status: "PAYMENT_REQUIRED" },
    });
  }

  logger.info(LOG_EVENTS.paymentEvent, {
    contractId: contract.id,
    paymentId: payment.id,
    amount: charged,
    currency: quote.currency,
    status: payment.status,
  });

  await recordAudit({
    action: "PAYMENT_INITIATED",
    entityType: "Payment",
    entityId: payment.id,
    actorId: params.userId,
    actorRole: params.actorRole,
    metadata: {
      contractId: contract.id,
      amount: charged,
      subtotal: quote.amount,
      vatRate: vat?.rate ?? null,
      currency: quote.currency,
      type: quote.type,
      providerPaymentId: initiation.providerPaymentId,
    },
  });

  return { payment, initiation };
}

export interface ProcessSettlementParams {
  rawBody: string;
  signatureHeader: string | null;
}

export async function processPaymentSettlement(params: ProcessSettlementParams): Promise<{
  settled: boolean;
  payment: Payment;
  status: PaymentStatus;
}> {
  const provider = getPaymentProvider();
  const isValid = provider.verifyWebhook(params.rawBody, params.signatureHeader);
  if (!isValid) {
    logger.error(LOG_EVENTS.paymentFailed, { reason: "INVALID_WEBHOOK_SIGNATURE" });
    throw new Error("INVALID_WEBHOOK_SIGNATURE");
  }

  const settlement: SettlementResult = provider.parseSettlement(params.rawBody);

  const payment = await db.payment.findFirst({
    where: { providerPaymentId: settlement.providerPaymentId },
    include: { contract: true },
  });

  if (!payment) {
    logger.error(LOG_EVENTS.paymentFailed, {
      reason: "PAYMENT_RECORD_NOT_FOUND",
      providerPaymentId: settlement.providerPaymentId,
    });
    throw new Error("PAYMENT_RECORD_NOT_FOUND");
  }

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      provider: provider.name,
      externalEventId: settlement.externalEventId,
      eventType: settlement.status,
      payload: settlement.raw as never,
      processedAt: new Date(),
    },
  });

  if (settlement.status === "PAID" || settlement.status === "AUTHORIZED") {
    if (Number(payment.amount) !== settlement.amount || payment.currency !== settlement.currency) {
      logger.error(LOG_EVENTS.paymentFailed, {
        paymentId: payment.id,
        reason: "AMOUNT_MISMATCH",
        expected: payment.amount,
        received: settlement.amount,
      });
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: `Amount mismatch: expected ${payment.amount} ${payment.currency}, received ${settlement.amount} ${settlement.currency}`,
        },
      });
      throw new Error("AMOUNT_MISMATCH");
    }

    const captured = settlement.status === "PAID";
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: settlement.status,
        paidAt: captured ? new Date() : null,
      },
    });

    // A captured payment gets its sequential invoice number immediately; the
    // PDF is rendered on demand. A numbering failure never voids the capture —
    // the download path re-issues lazily.
    if (captured) {
      try {
        await issueInvoiceForPayment(payment.id);
      } catch (error) {
        logger.error(LOG_EVENTS.paymentFailed, {
          paymentId: payment.id,
          reason: "INVOICE_ISSUANCE_FAILED",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (payment.contractId && payment.contract) {
      if (payment.contract.status === "PAYMENT_REQUIRED") {
        assertTransition("PAYMENT_REQUIRED", "PAYMENT_CONFIRMED");
        await db.contract.update({
          where: { id: payment.contractId },
          data: { status: "PAYMENT_CONFIRMED" },
        });

        // §8b — a paid verification case opens the automated check instead of
        // the document generation; the state machine decides the branch.
        if (payment.contract.origin === "VERIFICATION") {
          await markVerificationContractPaid({ contractId: payment.contractId });
        }
      }
    }

    logger.info(LOG_EVENTS.paymentEvent, {
      paymentId: payment.id,
      contractId: payment.contractId,
      status: settlement.status,
    });

    if (!captured) {
      // §26 / product rule 4 — the provider secured the funds, the case may
      // start, but nothing is cashed before a human validation.
      const captureMode =
        typeof payment.metadata === "object" &&
        payment.metadata !== null &&
        "captureMode" in payment.metadata
          ? (payment.metadata as { captureMode?: string }).captureMode
          : null;

      await recordAudit({
        action: "PAYMENT_AUTHORIZED",
        entityType: "Payment",
        entityId: payment.id,
        actorId: payment.userId,
        actorRole: "CLIENT",
        metadata: {
          contractId: payment.contractId,
          amount: settlement.amount,
          currency: settlement.currency,
          captureMode: captureMode ?? "ON_VALIDATION",
          externalEventId: settlement.externalEventId,
        },
      });

      return { settled: true, payment: updatedPayment, status: "AUTHORIZED" };
    }

    await recordAudit({
      action: "PAYMENT_COMPLETED",
      entityType: "Payment",
      entityId: payment.id,
      actorId: payment.userId,
      actorRole: "CLIENT",
      metadata: {
        contractId: payment.contractId,
        amount: settlement.amount,
        currency: settlement.currency,
        externalEventId: settlement.externalEventId,
      },
    });

    return { settled: true, payment: updatedPayment, status: "PAID" };
  }

  // A hold (or a pending checkout) that never became a payment: the amount is
  // simply released — audited with an explicit reason, never silently dropped.
  if (settlement.status === "CANCELLED") {
    if (payment.status !== "PENDING" && payment.status !== "AUTHORIZED") {
      return { settled: false, payment, status: payment.status };
    }
    const released = await db.payment.update({
      where: { id: payment.id },
      data: { status: "CANCELLED", failureReason: settlement.failureReason ?? "HOLD_RELEASED_AT_PROVIDER" },
    });
    logger.info(LOG_EVENTS.paymentEvent, { paymentId: payment.id, status: "CANCELLED" });
    await recordAudit({
      action: "CONTRACT_UPDATED",
      entityType: "Payment",
      entityId: payment.id,
      actorId: payment.userId,
      actorRole: "CLIENT",
      metadata: {
        contractId: payment.contractId,
        from: payment.status,
        to: "CANCELLED",
        externalEventId: settlement.externalEventId,
      },
    });
    return { settled: false, payment: released, status: "CANCELLED" };
  }

  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      failureReason: settlement.failureReason ?? "PAYMENT_FAILED_AT_PROVIDER",
    },
  });

  logger.warn(LOG_EVENTS.paymentFailed, {
    paymentId: payment.id,
    contractId: payment.contractId,
    reason: settlement.failureReason,
  });

  await recordAudit({
    action: "PAYMENT_FAILED",
    entityType: "Payment",
    entityId: payment.id,
    actorId: payment.userId,
    actorRole: "CLIENT",
    metadata: {
      contractId: payment.contractId,
      failureReason: settlement.failureReason,
    },
  });

  return { settled: false, payment: updatedPayment, status: "FAILED" };
}

/** Sandbox helper: emits the provider-side event for a hold, HMAC signed. */
async function providerHoldEvent(
  signer: MockPaymentProvider,
  payment: { providerPaymentId: string | null; amount: unknown; currency: string },
  status: "PAID" | "CANCELLED",
): Promise<void> {
  const rawBody = JSON.stringify({
    providerPaymentId: payment.providerPaymentId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status,
    eventId: `mock_evt_${payment.providerPaymentId}_${status.toLowerCase()}`,
  });
  await processPaymentSettlement({ rawBody, signatureHeader: signer.sign(rawBody) });
}

/** Contract states that prove a human validated the case — capture becomes legitimate. */
const VALIDATION_PROOF_STATUSES = ["VALIDATED", "SIGNATURE_PENDING", "SIGNED", "FINAL"] as const;

/**
 * §26 / product rule 4 — captures an authorized hold.
 *
 * Only callable by a lawyer or an admin, and only on a case whose state proves
 * the lawyer's validation. The capture goes through the same signed provider
 * callback as a real CMI/Payzone manual capture would.
 */
export async function captureAuthorizedPaymentInSandbox(params: {
  contractId: string;
  actorRole: UserRole;
  actorId: string | null;
}): Promise<{ captured: boolean; paymentStatus: string }> {
  if (params.actorRole !== "LAWYER" && params.actorRole !== "ADMIN") {
    throw new Error("FORBIDDEN_CAPTURE_ROLE");
  }

  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    select: { status: true, payments: { orderBy: { createdAt: "desc" } } },
  });

  if (!(VALIDATION_PROOF_STATUSES as readonly string[]).includes(contract.status)) {
    throw new Error(`CAPTURE_BEFORE_VALIDATION: ${contract.status}`);
  }

  const payment = contract.payments.find((candidate) => candidate.status === "AUTHORIZED");
  if (!payment) {
    return { captured: false, paymentStatus: contract.payments[0]?.status ?? "NONE" };
  }

  const provider = getPaymentProvider();
  if (!(provider instanceof MockPaymentProvider)) {
    throw new Error("SANDBOX_CAPTURE_UNAVAILABLE_WITH_REAL_PROVIDER");
  }

  await providerHoldEvent(provider, payment, "PAID");
  return { captured: true, paymentStatus: "PAID" };
}

/**
 * §26 — releases an authorized hold (case cancelled, case refused, service
 * never started). Uses the provider CANCELLED event through the signed path;
 * the funds were never debited, this is a void, not a refund.
 */
export async function releaseAuthorizedPaymentInSandbox(params: {
  contractId: string;
  reason?: string;
}): Promise<{ released: boolean }> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    select: { payments: { orderBy: { createdAt: "desc" } } },
  });

  const payment = contract.payments.find((candidate) => candidate.status === "AUTHORIZED");
  if (!payment) return { released: false };

  const provider = getPaymentProvider();
  if (!(provider instanceof MockPaymentProvider)) {
    throw new Error("SANDBOX_RELEASE_UNAVAILABLE_WITH_REAL_PROVIDER");
  }

  await providerHoldEvent(provider, payment, "CANCELLED");
  return { released: true };
}

