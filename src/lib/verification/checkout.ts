import "server-only";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { appConfig } from "@/lib/config";
import { nextContractReference } from "@/lib/contracts/service";
import { assertTransition } from "@/lib/contracts/state-machine";
import { logger } from "@/lib/logging";
import { initiatePayment, processPaymentSettlement } from "@/lib/payments/service";
import { applyVat, quoteVerification } from "@/lib/payments/pricing";
import { guestEmailSchema } from "@/lib/guest/validation";
import { getPaymentProvider, MockPaymentProvider } from "@/lib/payments/provider";
import {
  VerificationIntakeError,
  verificationTokenHash,
  findVerificationIntakeByContract,
} from "./service";

/** Re-exported for the route handlers' error mapping. */
export { VerificationIntakeError };

/**
 * §8b — checkout orchestration of the verification journey.
 *
 * The uploaded document becomes a first-class contract case: origin VERIFICATION,
 * a synthetic examination contract type, the uploaded file attached as a
 * CLIENT_DOCUMENT, and the payment quoted by the same pricing engine as every
 * other service — tier decides whether the automated check (paid now) or the
 * lawyer branch (captured only after the lawyer validates) runs next.
 *
 * Lives in its own module — importing the payment service here while the
 * payment service imports the intake lifecycle would create a cycle.
 */

/** Synthetic contract type carrying verification cases (seeded, inactive: never listed). */
export const VERIFICATION_CONTRACT_TYPE_CODE = "VERIFICATION_EXAMINATION";

export interface VerificationCheckoutOutcome {
  contractReference: string;
  amount: number;
  currency: string;
  providerPaymentId: string | null;
  simulated: boolean;
  instructionsFr: string;
  instructionsAr: string;
  alreadyPaid: boolean;
  alreadyInitiated: boolean;
}

/**
 * Entry point of the paid verification: e-mail first (report delivery, like
 * every checkout), then a contract case and the provider checkout. The bearer
 * token authorises the call — the intake is anonymous until payment.
 */
export async function startVerificationCheckout(params: {
  token: string;
  email: string;
}): Promise<VerificationCheckoutOutcome> {
  const intake = await resolveIntakeForCheckout(params.token);

  const parsedEmail = guestEmailSchema.safeParse({ email: params.email });
  if (!parsedEmail.success) throw new VerificationIntakeError("EMAIL_INVALID");
  const email = parsedEmail.data.email.trim().toLowerCase();

  const type = await db.contractType.findUnique({ where: { code: VERIFICATION_CONTRACT_TYPE_CODE } });
  if (!type) throw new VerificationIntakeError("TYPE_UNRESOLVED");

  const quote = applyVat(
    quoteVerification({ tier: intake.tier, currency: appConfig.currency }),
  );

  // An intake is checked out exactly once: an existing case resumes, paid or
  // pending — the payment row keeps a single pending attempt (§26).
  if (intake.contractId) {
    const existing = await resumeContractCheckout(intake.contractId, email);
    if (existing) return existing;
  }

  const contractId = await createVerificationContract({
    email,
    language: intake.language === "AR" ? "ar" : "fr",
    contractTypeId: type.id,
    title: `Vérification de document — ${intake.filename}`,
    filename: intake.filename,
    amount: quote.amount,
    amountCharged: quote.vat ? quote.vat.total : quote.amount,
    currency: quote.currency,
    tier: intake.tier,
    storage: {
      provider: intake.storageProvider,
      path: intake.storagePath,
      filename: intake.filename,
      mimeType: intake.mimeType,
      sizeBytes: intake.sizeBytes,
      checksum: intake.checksum,
    },
  });

  await db.verificationIntake.update({
    where: { id: intake.id },
    data: { contractId, email },
  });

  const { payment, initiation } = await initiatePayment({
    contractId,
    userId: null,
    actorRole: null,
    userEmail: email,
    quote,
    // Product rule 4 — the lawyer tier is only a hold here; capture happens
    // when the lawyer's attestation validates the case.
    captureMode: intake.tier === "LAWYER" ? "ON_VALIDATION" : "IMMEDIATE",
  });
  const provider = getPaymentProvider();

  logger.info("verification.checkout_started", {
    contractId,
    paymentId: payment.id,
    tier: intake.tier,
    amount: Number(payment.amount),
    charged: quote.vat ? quote.vat.total : quote.amount,
  });
  await recordAudit({
    action: "PAYMENT_INITIATED",
    entityType: "Payment",
    entityId: payment.id,
    actorId: null,
    actorRole: null,
    metadata: { contractId, intakeId: intake.id, tier: intake.tier },
  });

  return {
    contractReference: (await db.contract.findUniqueOrThrow({ where: { id: contractId }, select: { reference: true } })).reference,
    amount: payment.type === "VERIFICATION_ASSISTED" ? quote.amount : quote.amount,
    currency: quote.currency,
    providerPaymentId: payment.providerPaymentId,
    simulated: provider.simulated,
    instructionsFr: initiation.instructionsFr,
    instructionsAr: initiation.instructionsAr,
    alreadyPaid: false,
    alreadyInitiated: false,
  };
}

/** Same contract → same checkout: return the pending payment instead of a second one. */
async function resumeContractCheckout(
  contractId: string,
  email: string,
): Promise<VerificationCheckoutOutcome | null> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { reference: true, customerEmail: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!contract) return null;

  if (contract.customerEmail !== email || contract.customerEmail === null) {
    await db.contract.update({ where: { id: contractId }, data: { customerEmail: email } });
  }

  const paid = contract.payments.find((payment) => payment.status === "PAID");
  const pending = contract.payments.find((payment) => payment.status === "PENDING");
  const provider = getPaymentProvider();
  const referenced = paid ?? pending;
  if (!referenced) return null;

  return {
    contractReference: contract.reference,
    amount: Number(referenced.amount),
    currency: referenced.currency,
    providerPaymentId: referenced.providerPaymentId,
    simulated: provider.simulated,
    instructionsFr: alreadyMessageFr(Boolean(paid), Number(referenced.amount), referenced.currency),
    instructionsAr: alreadyMessageAr(Boolean(paid), Number(referenced.amount), referenced.currency),
    alreadyPaid: Boolean(paid),
    alreadyInitiated: Boolean(pending),
  };
}

function alreadyMessageFr(paid: boolean, amount: number, currency: string): string {
  return paid
    ? "Paiement déjà confirmé."
    : `Un paiement est déjà en attente (${amount} ${currency}).`;
}

function alreadyMessageAr(paid: boolean, amount: number, currency: string): string {
  return paid
    ? "تم تأكيد الأداء مسبقاً."
    : `يوجد أداء قيد الانتظار (${amount} ${currency}).`;
}

async function createVerificationContract(params: {
  email: string;
  language: "fr" | "ar";
  contractTypeId: string;
  title: string;
  filename: string;
  amount: number;
  amountCharged: number;
  currency: string;
  tier: "ASSISTED" | "LAWYER";
  storage: {
    provider: string;
    path: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
  };
}): Promise<string> {
  const reference = await nextContractReference();
  const language = params.language === "ar" ? "AR" : "FR";

  const contract = await db.contract.create({
    data: {
      reference,
      contractTypeId: params.contractTypeId,
      customerEmail: params.email,
      title: params.title.slice(0, 160),
      language,
      jurisdiction: appConfig.primaryJurisdiction,
      status: "DRAFT",
      origin: "VERIFICATION",
      intentCode: "VERIFY_EXISTING_DOCUMENT",
      summaryFr:
        params.tier === "ASSISTED"
          ? "Vérification automatisée d'un document existant (complétude et cohérence)."
          : "Revue d'un document existant par un avocat, avec attestation signée séparée.",
      summaryAr:
        params.tier === "ASSISTED"
          ? "تحقق آلي من وثيقة جاهزة (الاكتمال والاتساق)."
          : "مراجعة وثيقة جاهزة من محامٍ مع شهادة موقّعة منفصلة.",
      priceAmount: params.amount,
      priceCurrency: params.currency,
      documents: {
        create: [
          {
            documentType: "CLIENT_DOCUMENT",
            storageProvider: params.storage.provider,
            storagePath: params.storage.path,
            filename: params.storage.filename,
            mimeType: params.storage.mimeType,
            sizeBytes: params.storage.sizeBytes,
            checksum: params.storage.checksum,
            version: 1,
          },
        ],
      },
    },
  });

  // The walk through the lifecycle is audited step by step, exactly like a
  // questionnaire case would be — created, routed, payable.
  assertTransition(contract.status, "READY_FOR_ROUTING");
  await db.contract.update({ where: { id: contract.id }, data: { status: "READY_FOR_ROUTING" } });
  assertTransition("READY_FOR_ROUTING", "ROUTED");
  await db.contract.update({ where: { id: contract.id }, data: { status: "ROUTED" } });

  logger.info("verification.contract_created", { contractId: contract.id, reference, tier: params.tier });
  await recordAudit({
    action: "CONTRACT_CREATED",
    entityType: "Contract",
    entityId: contract.id,
    actorId: null,
    actorRole: null,
    metadata: { origin: "VERIFICATION", tier: params.tier, reference },
  });

  return contract.id;
}

/** The checkout needs the live intake; anything else is refused, not guessed. */
async function resolveIntakeForCheckout(token: string) {
  const row = await db.verificationIntake.findUnique({ where: { tokenHash: verificationTokenHash(token) } });
  if (!row) throw new VerificationIntakeError("TOKEN_NOT_FOUND");
  if (row.status === "DELETED") throw new VerificationIntakeError("INTAKE_DELETED");
  if (row.status !== "RECEIVED" && row.contractId === null) {
    throw new VerificationIntakeError("INTAKE_STATE_INCOMPATIBLE");
  }
  if (row.expiresAt.getTime() < Date.now()) throw new VerificationIntakeError("INTAKE_EXPIRED");
  return row;
}

/**
 * Sandbox settlement of a verification payment, driven through the exact
 * same signature-verified webhook path a real provider would use — never a
 * plain browser mutation. The state machine takes over when it settles.
 */
export async function settleVerificationPayment(params: {
  token: string;
}): Promise<{ paid: boolean; status: string; alreadyPaid: boolean }> {
  const intake = await db.verificationIntake.findUnique({
    where: { tokenHash: verificationTokenHash(params.token) },
  });
  if (!intake || !intake.contractId) throw new VerificationIntakeError("NO_PENDING_PAYMENT");

  const contract = await db.contract.findUnique({
    where: { id: intake.contractId },
    select: { payments: { orderBy: { createdAt: "desc" } } },
  });
  const payment = contract?.payments.find((candidate) => candidate.status === "PENDING");

  if (intake.status !== "RECEIVED" || !payment) {
    const attached = await findVerificationIntakeByContract(intake.contractId);
    return { paid: false, status: attached?.status ?? "RECEIVED", alreadyPaid: true };
  }

  const metadata = (payment.metadata ?? null) as { captureMode?: string } | null;
  const targetStatus = metadata?.captureMode === "ON_VALIDATION" ? "AUTHORIZED" : "PAID";

  const provider = getPaymentProvider();
  if (!(provider instanceof MockPaymentProvider)) {
    throw new VerificationIntakeError("SANDBOX_SETTLEMENT_UNAVAILABLE");
  }
  const rawBody = JSON.stringify({
    providerPaymentId: payment.providerPaymentId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: targetStatus,
    eventId: `mock_evt_${payment.id}`,
  });

  const settlement = await processPaymentSettlement({
    rawBody,
    signatureHeader: provider.sign(rawBody),
  });
  // A hold (AUTHORIZED) launches the work exactly like a captured payment —
  // the difference is only *when* money actually moves.
  const triggered = settlement.settled && (settlement.status === "PAID" || settlement.status === "AUTHORIZED");

  // The settlement hook advanced the contract; mirror it on the intake status.
  if (triggered) {
    await db.verificationIntake.update({ where: { id: intake.id }, data: { status: "CHECKING" } });
  }

  return { paid: triggered, status: triggered ? "CHECKING" : "PENDING", alreadyPaid: false };
}
