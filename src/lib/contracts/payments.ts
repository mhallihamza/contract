import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import {
  actorAudit,
  actorId,
  actorRole,
  assertCaseAccess,
  type CaseActor,
} from "@/lib/contracts/actor";
import { contractNeedsLawyer } from "@/lib/contracts/service";
import { generateDraftForContract, requestLawyerForContract } from "@/lib/contracts/drafting";
import { getPaymentProvider, MockPaymentProvider } from "@/lib/payments/provider";
import { initiatePayment, processPaymentSettlement } from "@/lib/payments/service";
import { quoteService } from "@/lib/payments/pricing";
import { notifyCaseOwner } from "@/lib/notifications/case-owner";
import { logger } from "@/lib/logging";

/**
 * Payment step and post-payment orchestration (§26, §27).
 *
 * The client never sends an amount: the price is quoted server-side from the
 * routing decision and the service actually requested. In this environment the
 * provider is the labelled mock, and the settlement goes through exactly the same
 * signature-verified path a real provider callback would use.
 */

export interface StartPaymentResult {
  paymentId: string;
  amount: number;
  currency: string;
  simulated: boolean;
  instructionsFr: string;
  instructionsAr: string;
  alreadyPaid: boolean;
}

export async function startContractPayment(params: {
  contractId: string;
  actor: CaseActor;
}): Promise<StartPaymentResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true, payments: { orderBy: { createdAt: "desc" } } },
  });

  assertCaseAccess(contract, params.actor);

  const provider = getPaymentProvider();
  const quoteInput = {
    route: contract.route ?? ("ROUTING_UNDETERMINED" as const),
    lawyerServiceSelected: Boolean(contract.lawyerRequest),
    signatureRequired:
      contract.route === "LAWYER_SIGNATURE_REQUIRED" || Boolean(contract.lawyerRequest?.requiresSignature),
    currency: contract.priceCurrency,
  };

  const paidPayment = contract.payments.find((payment) => payment.status === "PAID");
  if (paidPayment) {
    return {
      paymentId: paidPayment.id,
      amount: Number(paidPayment.amount),
      currency: paidPayment.currency,
      simulated: provider.simulated,
      instructionsFr: "Paiement déjà confirmé.",
      instructionsAr: "تم تأكيد الأداء مسبقاً.",
      alreadyPaid: true,
    };
  }

  const existingPending = contract.payments.find((payment) => payment.status === "PENDING");
  if (existingPending) {
    return {
      paymentId: existingPending.id,
      amount: Number(existingPending.amount),
      currency: existingPending.currency,
      simulated: provider.simulated,
      instructionsFr: `Un paiement est déjà en attente (${Number(existingPending.amount)} ${existingPending.currency}).`,
      instructionsAr: `يوجد أداء قيد الانتظار (${Number(existingPending.amount)} ${existingPending.currency}).`,
      alreadyPaid: false,
    };
  }

  const quote = quoteService(quoteInput);

  const { payment, initiation } = await initiatePayment({
    contractId: contract.id,
    userId: actorId(params.actor),
    actorRole: actorRole(params.actor),
    userEmail: contract.customerEmail ?? params.actor.email ?? "",
    quoteInput,
  });

  await db.contract.update({ where: { id: contract.id }, data: { priceAmount: quote.amount } });

  await notifyCaseOwner({
    contract,
    type: "PAYMENT_REQUIRED",
    title: "Paiement requis",
    body: `Le règlement de ${quote.amount} ${quote.currency} est nécessaire pour lancer la préparation du dossier ${contract.reference}.`,
    href: `/app/contracts/${contract.id}`,
  });

  return {
    paymentId: payment.id,
    amount: quote.amount,
    currency: quote.currency,
    simulated: provider.simulated,
    instructionsFr: initiation.instructionsFr,
    instructionsAr: initiation.instructionsAr,
    alreadyPaid: false,
  };
}

export interface SettlePaymentResult {
  paid: boolean;
  draftGenerated: boolean;
  lawyerRequested: boolean;
  lawyerAssigned: boolean;
  message: string;
}

/**
 * Reproduces the provider confirmation for the sandbox provider only.
 *
 * The mock provider signs its own callback (HMAC) and the settlement is applied by
 * the same server-side verification used for a real webhook — a browser can never
 * mark a payment as paid.
 */
export async function settleContractPaymentInSandbox(params: {
  contractId: string;
  actor: CaseActor;
}): Promise<SettlePaymentResult> {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
    include: { lawyerRequest: true, payments: { orderBy: { createdAt: "desc" } } },
  });

  assertCaseAccess(contract, params.actor);

  const provider = getPaymentProvider();
  if (!(provider instanceof MockPaymentProvider)) {
    throw new Error("SANDBOX_SETTLEMENT_UNAVAILABLE_WITH_REAL_PROVIDER");
  }

  const payment = contract.payments.find((candidate) => candidate.status === "PENDING");
  if (!payment) throw new Error("NO_PENDING_PAYMENT");

  const rawBody = JSON.stringify({
    providerPaymentId: payment.providerPaymentId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: "PAID",
    eventId: `mock_evt_${payment.id}`,
  });

  const settlement = await processPaymentSettlement({
    rawBody,
    signatureHeader: provider.sign(rawBody),
  });

  if (!settlement.settled) {
    await notifyCaseOwner({
      contract,
      type: "PAYMENT_REQUIRED",
      title: "Le paiement n'a pas abouti",
      body: "Aucune prestation n'a été engagée. Vous pouvez relancer le règlement depuis votre dossier.",
      href: `/app/contracts/${contract.id}`,
    });
    return { paid: false, draftGenerated: false, lawyerRequested: false, lawyerAssigned: false, message: "PAYMENT_NOT_SETTLED" };
  }

  const draft = await generateDraftForContract({ contractId: contract.id, actor: params.actor });

  let lawyerRequested = false;
  let lawyerAssigned = false;
  if (contractNeedsLawyer(contract.route) || Boolean(contract.lawyerRequest)) {
    const outcome = await requestLawyerForContract({ contractId: contract.id, actor: params.actor });
    lawyerRequested = outcome.requested;
    lawyerAssigned = outcome.assigned;
  }

  await recordAudit({
    action: "PAYMENT_COMPLETED",
    entityType: "Payment",
    entityId: payment.id,
    ...actorAudit(params.actor),
    metadata: {
      contractId: contract.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      draftVersion: draft.versionNumber,
      source: "sandbox-settlement",
    },
  });

  logger.info("payment.settled", {
    contractId: contract.id,
    paymentId: payment.id,
    amount: Number(payment.amount),
    draftVersion: draft.versionNumber,
    lawyerAssigned,
  });

  return {
    paid: true,
    draftGenerated: true,
    lawyerRequested,
    lawyerAssigned,
    message: "PAYMENT_SETTLED",
  };
}
