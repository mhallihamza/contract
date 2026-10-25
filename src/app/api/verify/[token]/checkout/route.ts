import { NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { VerificationIntakeError, startVerificationCheckout } from "@/lib/verification/checkout";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";

/**
 * §8b — checkout of a verification intake.
 *
 * The e-mail is validated server-side (same rule as every other checkout), the
 * contract case and the provider checkout are created atomically by the
 * orchestration module, and the client only ever learns the instructions the
 * provider returned — never an amount it chose, never a status.
 */

const STATUS_BY_CODE: Record<string, number> = {
  TOKEN_NOT_FOUND: 404,
  INTAKE_DELETED: 409,
  INTAKE_EXPIRED: 409,
  INTAKE_STATE_INCOMPATIBLE: 409,
  EMAIL_INVALID: 400,
  TYPE_UNRESOLVED: 409,
  NO_PENDING_PAYMENT: 409,
  SANDBOX_SETTLEMENT_UNAVAILABLE: 409,
};

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const limited = enforceRateLimit(request, "verify-action", RATE_RULES.verifyAction);
  if (limited) return limited;

  const { token } = await context.params;

  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    if (!body || typeof body.email !== "string") {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
    }
    const outcome = await startVerificationCheckout({ token, email: body.email });
    return NextResponse.json({ ok: true, data: outcome });
  } catch (error) {
    if (error instanceof VerificationIntakeError) {
      logger.warn("verification.checkout_rejected", { code: error.code });
      return NextResponse.json(
        { ok: false, error: error.code },
        { status: STATUS_BY_CODE[error.code] ?? 400 },
      );
    }
    logger.error("verification.checkout_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
