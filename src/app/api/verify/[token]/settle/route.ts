import { NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { VerificationIntakeError, settleVerificationPayment } from "@/lib/verification/checkout";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";

/**
 * §8b — sandbox settlement of a verification payment.
 *
 * Same security shape as every other settlement: the mock provider signs its
 * own callback and the shared, signature-verified path applies it. A browser
 * can never mark a payment as paid. With a real provider configured this
 * endpoint answers that the sandbox is unavailable (real webhooks settle).
 */

const STATUS_BY_CODE: Record<string, number> = {
  TOKEN_NOT_FOUND: 404,
  NO_PENDING_PAYMENT: 409,
  SANDBOX_SETTLEMENT_UNAVAILABLE: 409,
};

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const limited = enforceRateLimit(_request, "verify-action", RATE_RULES.verifyAction);
  if (limited) return limited;

  const { token } = await context.params;

  try {
    const outcome = await settleVerificationPayment({ token });
    return NextResponse.json({ ok: true, data: outcome });
  } catch (error) {
    if (error instanceof VerificationIntakeError) {
      logger.warn("verification.settle_rejected", { code: error.code });
      return NextResponse.json(
        { ok: false, error: error.code },
        { status: STATUS_BY_CODE[error.code] ?? 400 },
      );
    }
    logger.error("verification.settle_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
