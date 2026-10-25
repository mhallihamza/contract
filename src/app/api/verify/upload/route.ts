import { NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";
import { verifyMaxBytes } from "@/lib/verification/rules";
import { VerificationIntakeError, createVerificationIntake } from "@/lib/verification/service";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";

/**
 * Verification upload (§8b: "faire vérifier un document existant").
 *
 * The endpoint receives a multipart form with exactly three things: the file,
 * the tier and nothing else. Type, size, executables and macros are judged
 * server-side (pure rules + magic bytes), the file is stored privately and the
 * response carries a one-time bearer token for the confirmation screen. No
 * personal data is required before payment. Intake is rate-limited per source
 * address — a stranger's upload is the most expensive anonymous payload.
 */

const STATUS_BY_CODE: Record<string, number> = {
  TIER_NOT_ALLOWED: 400,
  FILE_EMPTY: 400,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  EXECUTABLE_NOT_ALLOWED: 415,
  MACROS_NOT_ALLOWED: 415,
  TYPE_MISMATCH: 415,
};

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "verify-upload", RATE_RULES.verifyUpload);
  if (limited) return limited;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" }, { status: 415 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const tier = form.get("tier");

    if (!(file instanceof File) || !(typeof tier === "string")) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_FAILED", details: { file: !file, tier: typeof tier !== "string" } },
        { status: 400 },
      );
    }

    // Fail fast on size before buffering the whole body twice.
    if (file.size > verifyMaxBytes()) {
      return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const locale = await getServerLocale();

    const result = await createVerificationIntake({
      filename: file.name,
      mimeType: file.type,
      bytes,
      tier,
      locale,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof VerificationIntakeError) {
      logger.warn("verification.upload_rejected", { code: error.code });
      return NextResponse.json(
        { ok: false, error: error.code },
        { status: STATUS_BY_CODE[error.code] ?? 400 },
      );
    }
    logger.error("verification.upload_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
