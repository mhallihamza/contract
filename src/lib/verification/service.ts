import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import type { VerificationIntake, VerificationTier } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { assertTransition } from "@/lib/contracts/state-machine";
import { getStorageProvider } from "@/lib/documents/storage";
import { logger } from "@/lib/logging";
import {
  verifyMaxBytes,
  verifyRetentionDays,
  verifyTokenHash,
  validateVerificationUpload,
  verificationTierFor,
  VERIFICATION_ACCEPTED_MIMES,
} from "./rules";

/**
 * Verification intake service (§8b) — the "check an existing document" journey.
 *
 * A visitor who already holds a contract uploads it, picks a tier, and gets a
 * bearer-confirmed receipt. The file never becomes publicly reachable: it is
 * stored through the same private storage provider as every other document and
 * its path is never returned to a browser. No form is asked before payment —
 * only the file and the tier.
 */

const TOKEN_BYTES = 32;
const BASE64URL_TOKEN = /^[A-Za-z0-9_-]{43}$/;

function hashToken(token: string): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim() || "development-session-secret";
  return verifyTokenHash(token, secret);
}

/** Token → stored hash, shared with the checkout orchestration. */
export const verificationTokenHash = hashToken;

/** Sequential human reference in the WQ family (matches the brand pattern). */
async function nextVerificationReference(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = `WQV-${year}-`;
  const last = await db.verificationIntake.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const lastSequence = last ? Number.parseInt(last.reference.slice(prefix.length), 10) : 0;
  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export interface VerificationIntakeSummary {
  reference: string;
  tier: VerificationTier;
  language: "fr" | "ar";
  status: string;
  filename: string;
  sizeBytes: number;
  createdAt: Date;
  expiresAt: Date;
}

/** Row → safe client shape. Storage paths, hashes and ids never leave the server. */
export function toIntakeSummary(row: VerificationIntake): VerificationIntakeSummary {
  return {
    reference: row.reference,
    tier: row.tier,
    language: row.language === "AR" ? "ar" : "fr",
    status: row.status,
    filename: row.filename,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export interface CreateVerificationIntakeParams {
  filename: string;
  mimeType: string;
  bytes: Buffer;
  /** Raw tier string from the client — narrowed server-side. */
  tier: string | undefined | null;
  locale: "fr" | "ar";
}

export interface CreateVerificationIntakeResult {
  /** The one-time bearer token for the confirmation screen. */
  token: string;
  summary: VerificationIntakeSummary;
  maxBytes: number;
  retentionDays: number;
}

/** Public error mapping for the route — stable codes, no stack traces. */
export class VerificationIntakeError extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Record<string, string>,
  ) {
    super(code);
  }
}

export async function createVerificationIntake(
  params: CreateVerificationIntakeParams,
): Promise<CreateVerificationIntakeResult> {
  const tier = verificationTierFor(params.tier);
  if (!tier) throw new VerificationIntakeError("TIER_NOT_ALLOWED");

  const maxBytes = verifyMaxBytes();
  const filename = params.filename.trim().slice(0, 180) || "document";
  const mimeType = params.mimeType.trim().toLowerCase();

  if (!VERIFICATION_ACCEPTED_MIMES.includes(mimeType)) {
    throw new VerificationIntakeError("UNSUPPORTED_FILE_TYPE");
  }

  // Server-side gate: size, type, executable and macro rejection all live in
  // the pure rules module — the client's word is only a hint.
  const rejection = validateVerificationUpload({ filename, mimeType, bytes: params.bytes, maxBytes });
  if (rejection) throw new VerificationIntakeError(rejection);

  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + verifyRetentionDays() * 24 * 60 * 60 * 1000);
  const reference = await nextVerificationReference();

  // The file goes to storage first, under a private key; the row records where.
  const intakeId = randomUUID();
  const storage = getStorageProvider();
  const stored = await storage.put({
    key: `verification/${intakeId}/${filename.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_").slice(0, 120)}`,
    bytes: params.bytes,
    mimeType,
  });

  const row = await db.verificationIntake.create({
    data: {
      id: intakeId,
      tokenHash: hashToken(token),
      reference,
      tier: tier as VerificationTier,
      language: params.locale === "ar" ? "AR" : "FR",
      filename,
      mimeType,
      sizeBytes: params.bytes.length,
      checksum: stored.checksum,
      storageProvider: stored.storageProvider,
      storagePath: stored.storagePath,
      status: "RECEIVED",
      expiresAt,
    },
  });

  logger.info("verification.intake_received", {
    intakeId: row.id,
    tier,
    sizeBytes: row.sizeBytes,
    retentionDays: verifyRetentionDays(),
  });

  await recordAudit({
    action: "VERIFICATION_UPLOADED",
    entityType: "VerificationIntake",
    entityId: row.id,
    actorId: null,
    actorRole: null,
    metadata: { tier, sizeBytes: row.sizeBytes, checksum: stored.checksum },
  });

  return {
    token,
    summary: toIntakeSummary(row),
    maxBytes,
    retentionDays: verifyRetentionDays(),
  };
}

/** Bearer resolution for the confirmation screen. */
export async function resolveVerificationIntake(
  token: string | null | undefined,
): Promise<VerificationIntakeSummary | null> {
  if (!token || !BASE64URL_TOKEN.test(token)) return null;
  const row = await db.verificationIntake.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row) return null;
  return toIntakeSummary(row);
}

/** Full state of the follow-up page: intake plus its contract case and payment. */
export async function resolveVerificationCase(
  token: string | null | undefined,
): Promise<{
  summary: VerificationIntakeSummary;
  caseReference: string | null;
  customerEmail: string | null;
  paid: boolean;
  hasPendingPayment: boolean;
} | null> {
  if (!token || !BASE64URL_TOKEN.test(token)) return null;
  const row = await db.verificationIntake.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row) return null;
  if (!row.contractId) {
    return { summary: toIntakeSummary(row), caseReference: null, customerEmail: null, paid: false, hasPendingPayment: false };
  }
  const contract = await db.contract.findUnique({
    where: { id: row.contractId },
    select: { reference: true, customerEmail: true, payments: { select: { status: true } } },
  });
  return {
    summary: toIntakeSummary(row),
    caseReference: contract?.reference ?? null,
    customerEmail: contract?.customerEmail ?? null,
    paid: contract?.payments.some((payment) => payment.status === "PAID") ?? false,
    hasPendingPayment: contract?.payments.some((payment) => payment.status === "PENDING") ?? false,
  };
}

/** Housekeeping: flagged once the retention deadline passed (admin/cron). */
export async function findExpiredVerificationIntakes(referenceTime = new Date()): Promise<string[]> {
  const rows = await db.verificationIntake.findMany({
    where: { expiresAt: { lte: referenceTime }, status: { not: "DELETED" } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/**
 * §8b — a settled verification payment opens the automated check.
 *
 * Called by the payment settlement path once the contract is PAYMENT_CONFIRMED:
 * the state machine branch (origin = VERIFICATION) advances the case to
 * VERIFICATION_IN_PROGRESS and the intake to CHECKING, both audited.
 */
export async function markVerificationContractPaid(params: { contractId: string }): Promise<void> {
  const contract = await db.contract.findUnique({ where: { id: params.contractId } });
  if (!contract || contract.status !== "PAYMENT_CONFIRMED") return;

  assertTransition(contract.status, "VERIFICATION_IN_PROGRESS");
  await db.contract.update({
    where: { id: contract.id },
    data: { status: "VERIFICATION_IN_PROGRESS" },
  });

  const intake = await db.verificationIntake.findFirst({ where: { contractId: contract.id } });
  if (intake) {
    await db.verificationIntake.update({ where: { id: intake.id }, data: { status: "CHECKING" } });
  }

  logger.info("verification.contract_in_progress", { contractId: contract.id, origin: contract.origin });
  await recordAudit({
    action: "CONTRACT_STATUS_CHANGED",
    entityType: "Contract",
    entityId: contract.id,
    actorId: null,
    actorRole: null,
    metadata: { origin: "VERIFICATION", from: "PAYMENT_CONFIRMED", to: "VERIFICATION_IN_PROGRESS" },
  });
}

/** Intake attached to a contract, for the checkout orchestration (§8b). */
export async function findVerificationIntakeByContract(contractId: string): Promise<VerificationIntake | null> {
  return db.verificationIntake.findFirst({ where: { contractId } });
}
