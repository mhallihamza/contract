import { NextResponse } from "next/server";
import { askAssistant } from "@/lib/ai/assistant";
import { getServerI18n } from "@/lib/i18n/server";
import { guestErrorResponse, readJsonBody } from "@/lib/guest/http";

/**
 * "Trouver mon document" (§28).
 *
 * Secondary by design: it maps a sentence to catalogue entries. It never answers a
 * legal question — the response only contains document suggestions and the
 * platform's own summaries, and the routing engine remains the only authority on
 * what a case requires.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readJsonBody(request);
    const text = typeof body.text === "string" ? body.text : "";
    if (text.trim().length < 3) return guestErrorResponse(new Error("INTENT_TEXT_TOO_SHORT"), { endpoint: "assistant" });

    const { locale } = await getServerI18n();
    const answer = await askAssistant({ text, locale });
    return NextResponse.json({ ok: true, data: answer });
  } catch (error) {
    return guestErrorResponse(error, { endpoint: "assistant.intent" });
  }
}
