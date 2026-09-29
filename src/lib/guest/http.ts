import { NextResponse } from "next/server";
import { logger } from "@/lib/logging";

/**
 * Error mapping for the public (guest) endpoints (§43).
 *
 * Customers never see a stack trace: a domain error becomes a stable code with a
 * sensible status, anything unknown becomes a generic 500 that is logged in full
 * server-side.
 */

const STATUS_BY_CODE: Record<string, number> = {
  GUEST_SESSION_NOT_FOUND: 401,
  GUEST_CASE_NOT_STARTED: 409,
  GUEST_CASE_NOT_FOUND: 404,
  FORBIDDEN: 403,
  EMAIL_REQUIRED_BEFORE_PAYMENT: 409,
  PARTIES_INCOMPLETE: 400,
  CASE_ALREADY_FINAL: 409,
  CONTRACT_NOT_ROUTED: 409,
  CONTRACT_NOT_ROUTABLE: 409,
  ROUTE_NOT_PAYABLE: 409,
  CONTRACT_NOT_PAYABLE: 409,
  LAWYER_REQUIRED_BY_ROUTE: 409,
  SELF_SERVICE_ONLY: 409,
  LAWYER_REVIEW_ALREADY_REQUESTED: 409,
  SERVICE_OFFER_NOT_ALLOWED: 400,
  SERVICE_CHOICE_NOT_APPLICABLE: 409,
  CONTRACT_TYPE_UNRESOLVED: 404,
  INVALID_PAYLOAD: 400,
  INTENT_TEXT_TOO_SHORT: 400,
  NO_PENDING_PAYMENT: 409,
  CONTRACT_NOT_CANCELLABLE: 409,
};

export interface GuestErrorBody {
  ok: false;
  error: string;
  details?: unknown;
}

export function guestErrorResponse(error: unknown, context: Record<string, unknown> = {}): NextResponse<GuestErrorBody> {
  const raw = error instanceof Error ? error.message : String(error);
  const code = raw.split(":")[0]!.trim();

  // Zod failures carry a stable marker so the UI can point at the faulty field.
  const validation = raw.startsWith("VALIDATION_FAILED");
  const status = validation ? 400 : (STATUS_BY_CODE[code] ?? 500);

  if (status >= 500) {
    logger.error("guest.endpoint_failed", { ...context, error: raw });
  } else {
    logger.warn("guest.endpoint_rejected", { ...context, code, error: raw });
  }

  return NextResponse.json<GuestErrorBody>(
    { ok: false, error: validation ? "VALIDATION_FAILED" : code },
    { status },
  );
}

export function guestOk<T>(data: T, status = 200): NextResponse<{ ok: true; data: T }> {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Reads a JSON body, tolerating an empty one. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
