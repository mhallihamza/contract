import type { NextResponse } from "next/server";
import {
  cancelGuestCase,
  requireGuestCase,
  routeGuestCase,
  saveGuestAnswers,
  saveGuestParties,
  selectGuestService,
  setGuestEmail,
  settleGuestPayment,
  startGuestPayment,
} from "@/lib/guest/service";
import { guestErrorResponse, guestOk, readJsonBody } from "@/lib/guest/http";
import {
  guestAnswersSchema,
  guestEmailSchema,
  guestPartiesSchema,
  guestServiceChoiceSchema,
} from "@/lib/guest/validation";

/**
 * Public case endpoint (§4, §37, §48).
 *
 * One POST entry point per case action, authenticated by the guest token in the
 * URL (the cookie is only a fallback). Every action re-validates the session,
 * re-derives the owner server-side and delegates to a domain service — the payload
 * can never carry an amount, a status, an owner or a lawyer.
 */

const ACTIONS = ["answers", "parties", "routing", "service", "email", "checkout", "settle", "cancel"] as const;
type GuestAction = (typeof ACTIONS)[number];

function isGuestAction(value: string): value is GuestAction {
  return (ACTIONS as readonly string[]).includes(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string; action: string }> },
): Promise<NextResponse> {
  const { token, action } = await context.params;
  try {
    if (action !== "state") return guestErrorResponse(new Error("UNKNOWN_ACTION"), { action });
    const { view } = await requireGuestCase(token);
    return guestOk(view);
  } catch (error) {
    return guestErrorResponse(error, { endpoint: "guest.state" });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string; action: string }> },
): Promise<NextResponse> {
  const { token, action } = await context.params;
  if (!isGuestAction(action)) return guestErrorResponse(new Error("UNKNOWN_ACTION"), { action });

  const body = await readJsonBody(request);

  try {
    switch (action) {
      case "answers": {
        const parsed = guestAnswersSchema.safeParse(body);
        if (!parsed.success) throw new Error("VALIDATION_FAILED: values");
        return guestOk(await saveGuestAnswers({ token, values: parsed.data.values }));
      }
      case "parties": {
        const parsed = guestPartiesSchema.safeParse(body);
        if (!parsed.success) throw new Error("VALIDATION_FAILED: parties");
        return guestOk(await saveGuestParties({ token, parties: parsed.data.parties }));
      }
      case "routing":
        return guestOk(await routeGuestCase({ token }));
      case "service": {
        const parsed = guestServiceChoiceSchema.safeParse(body);
        if (!parsed.success) throw new Error("VALIDATION_FAILED: offerKey");
        return guestOk(await selectGuestService({ token, offerKey: parsed.data.offerKey }));
      }
      case "email": {
        const parsed = guestEmailSchema.safeParse(body);
        if (!parsed.success) throw new Error("VALIDATION_FAILED: email");
        await setGuestEmail({ token, email: parsed.data.email });
        return guestOk({ email: parsed.data.email.trim().toLowerCase() });
      }
      case "checkout":
        return guestOk(await startGuestPayment({ token }));
      case "settle":
        return guestOk(await settleGuestPayment({ token }));
      case "cancel":
        await cancelGuestCase({ token, reason: typeof body.reason === "string" ? body.reason : undefined });
        return guestOk({ cancelled: true });
      default:
        return guestErrorResponse(new Error("UNKNOWN_ACTION"), { action });
    }
  } catch (error) {
    return guestErrorResponse(error, { action, session: token.slice(0, 8) });
  }
}
