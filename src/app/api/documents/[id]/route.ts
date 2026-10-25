import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit/logger";
import { getCurrentUser, roleAtLeast } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { readDocument } from "@/lib/documents/service";
import { logger } from "@/lib/logging";
import { resolveGuestRequest } from "@/lib/guest/session";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";

/**
 * Document download (§38).
 *
 * Authorization is decided server-side: the owner, the case's client, the assigned
 * lawyer, an uploader or a legal reviewer — or, before any account exists, the
 * guest session that owns the case (via its token). The stored checksum is
 * re-verified on every read and reported in a response header.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(request, "document-download", RATE_RULES.documentDownload);
  if (limited) return limited;

  const user = await getCurrentUser();
  const { id } = await context.params;

  try {
    const document = await db.contractDocument.findUnique({
      where: { id },
      include: {
        contract: {
          select: { id: true, clientId: true, assignedLawyerId: true, guestSessionId: true, reference: true },
        },
      },
    });
    if (!document) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    // Guest download: the token in the URL (or the cookie) proves ownership.
    let guest: Awaited<ReturnType<typeof resolveGuestRequest>> = null;
    if (!user) {
      const url = new URL(request.url);
      guest = await resolveGuestRequest(url.searchParams.get("token"));
      if (!guest) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const allowed = user
      ? document.ownerId === user.id ||
        document.uploadedById === user.id ||
        document.contract.clientId === user.id ||
        document.contract.assignedLawyerId === user.id ||
        roleAtLeast(user.role, "LEGAL_REVIEWER")
      : Boolean(document.contract.guestSessionId && document.contract.guestSessionId === guest!.id);

    if (!allowed) {
      logger.warn("document.download_denied", { documentId: id, userId: user?.id ?? null });
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { bytes, verified } = await readDocument(id);

    await recordAudit({
      action: "DOCUMENT_DOWNLOADED",
      entityType: "ContractDocument",
      entityId: document.id,
      actorId: user ? user.id : null,
      actorRole: user ? user.role : "CLIENT",
      metadata: {
        contractId: document.contractId,
        checksumVerified: verified,
        ...(user ? {} : { guestSessionId: guest!.id }),
      },
    });

    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": document.mimeType,
        "content-length": String(bytes.byteLength),
        "content-disposition": `attachment; filename="${document.filename.replace(/"/g, "")}"`,
        "cache-control": "private, no-store",
        "x-document-checksum": document.checksum,
        "x-checksum-verified": String(verified),
      },
    });
  } catch (error) {
    logger.error("document.download_failed", {
      documentId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "UNEXPECTED_ERROR" }, { status: 500 });
  }
}
