import { randomUUID } from "node:crypto";
import type { Payment, PaymentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { LOG_EVENTS, logger } from "@/lib/logging";
import { assertTransition } from "@/lib/contracts/state-machine";
import { getPaymentProvider, type PaymentIntent, type PaymentInitiation, type SettlementResult } from "./provider";
import { quoteService, type PriceQuoteInput } from "./pricing";

export interface InitiatePaymentParams {
  contractId: string;
  userId: string;
  actorRole: UserRole;
  userEmail: string;
  quoteInput: PriceQuoteInput;
  idempotencyKey?: string;
}

export interface InitiatePaymentOutcome {
  payment: Payment;
  initiation: PaymentInitiation;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentOutcome> {
  const quote = quoteService(params.quoteInput);
  if (!quote.payable || !quote.type) {
    throw new Error(`CONTRACT_NOT_PAYABLE: ${quote.reason}`);
  }

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
    amount: quote.amount,
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
      amount: quote.amount,
      currency: quote.currency,
      provider: provider.name,
      providerPaymentId: initiation.providerPaymentId,
      status: initiation.status,
      type: quote.type,
      idempotencyKey: params.idempotencyKey ?? randomUUID(),
      metadata: {
        lines: quote.lines as unknown as object,
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
    amount: quote.amount,
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
      amount: quote.amount,
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

  if (settlement.status === "PAID") {
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

    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    if (payment.contractId && payment.contract) {
      if (payment.contract.status === "PAYMENT_REQUIRED") {
        assertTransition("PAYMENT_REQUIRED", "PAYMENT_CONFIRMED");
        await db.contract.update({
          where: { id: payment.contractId },
          data: { status: "PAYMENT_CONFIRMED" },
        });
      }
    }

    logger.info(LOG_EVENTS.paymentEvent, {
      paymentId: payment.id,
      contractId: payment.contractId,
      status: "PAID",
    });

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

