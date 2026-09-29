import { NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { startGuestIntake } from "@/lib/guest/service";
import { guestErrorResponse } from "@/lib/guest/http";
import { logger } from "@/lib/logging";

/**
 * Catalogue CTA → anonymous case (§4, §48: scenario A).
 *
 * Accepts a plain HTML form post (no JavaScript required) as well as JSON, so the
 * product page works even before hydration — and so the whole journey stays
 * scriptable for the end-to-end smoke test.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  try {
    const slug = isForm
      ? String((await request.formData()).get("slug") ?? "").trim()
      : String(((await request.json().catch(() => ({}))) as { slug?: string }).slug ?? "").trim();

    if (!slug) return guestErrorResponse(new Error("VALIDATION_FAILED: slug"), { slug: "missing" });

    const locale = await getServerLocale();
    const result = await startGuestIntake({ slug, locale });

    const target = new URL(result.redirectUrl, request.url);
    if (isForm) return NextResponse.redirect(target, 303);

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (isForm) {
      logger.warn("guest.start_rejected", { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.redirect(new URL("/contracts?error=unavailable", request.url), 303);
    }
    return guestErrorResponse(error, { endpoint: "guest.start" });
  }
}
