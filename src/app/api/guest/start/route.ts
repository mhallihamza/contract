import { NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { startGuestIntake } from "@/lib/guest/service";
import { guestErrorResponse } from "@/lib/guest/http";
import { logger } from "@/lib/logging";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";

/**
 * Catalogue CTA → anonymous case (§4, §48: scenario A).
 *
 * Accepts a plain HTML form post (no JavaScript required) as well as JSON, so the
 * product page works even before hydration — and so the whole journey stays
 * scriptable for the end-to-end smoke test. Anonymous creation is rate-limited
 * per source address and carries a honeypot: a filled `company_website` field
 * answers like a success but never creates a case.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "guest-start", RATE_RULES.guestStart);
  if (limited) return limited;

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  try {
    let slug = "";
    let tier: string | undefined;
    let honeypot = "";
    if (isForm) {
      const form = await request.formData();
      slug = String(form.get("slug") ?? "").trim();
      const rawTier = form.get("tier");
      tier = typeof rawTier === "string" && rawTier.trim() ? rawTier.trim() : undefined;
      const rawHoneypot = form.get("company_website");
      honeypot = typeof rawHoneypot === "string" ? rawHoneypot.trim() : "";
    } else {
      const body = (await request.json().catch(() => ({}))) as {
        slug?: string;
        tier?: string;
        company_website?: string;
      };
      slug = String(body.slug ?? "").trim();
      tier = typeof body.tier === "string" && body.tier.trim() ? body.tier.trim() : undefined;
      honeypot = typeof body.company_website === "string" ? body.company_website.trim() : "";
    }

    // Honeypot (§48): no human ever sees the field. Answer like a success so
    // the bot learns nothing, and create nothing.
    if (honeypot) {
      logger.warn("guest.start_honeypot_triggered", { isForm });
      if (isForm) return NextResponse.redirect(new URL("/", request.url), 303);
      return NextResponse.json({ ok: true, data: { redirectUrl: "/" } }, { status: 201 });
    }

    if (!slug) return guestErrorResponse(new Error("VALIDATION_FAILED: slug"), { slug: "missing" });

    // The tier is only a convenience memory: startGuestIntake narrows it to a
    // fixed allowlist, and routing still decides everything it decides.
    const locale = await getServerLocale();
    const result = await startGuestIntake({ slug, locale, tier });

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
