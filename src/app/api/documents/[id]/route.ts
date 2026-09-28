import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit/logger";
import { getCurrentUser, roleAtLeast } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { readDocument } from "@/lib/documents/service";
import { logger } from "@/lib/logging";

/**
 * Document download (§38).
 *
 * Authorization is decided server-side: the owner, the case's client, the assigned
 * lawyer, an uploader or a legal reviewer. The stored checksum is re-verified on
 * every read and reported in a response header.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { id } = await context.params;

  try {
    const document = await db.contractDocument.findUnique({
      where: { id },
      include: { contract: { select: { id: true, clientId: true, assignedLawyerId: true, reference: true } } },
    });
    if (!document) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const allowed =
      document.ownerId === user.id ||
      document.uploadedById === user.id ||
      document.contract.clientId === user.id ||
      document.contract.assignedLawyerId === user.id ||
      roleAtLeast(user.role, "LEGAL_REVIEWER");

    if (!allowed) {
      logger.warn("document.download_denied", { documentId: id, userId: user.id });
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { bytes, verified } = await readDocument(id);

    await recordAudit({
      action: "DOCUMENT_DOWNLOADED",
      entityType: "ContractDocument",
      entityId: document.id,
      actorId: user.id,
      actorRole: user.role,
      metadata: { contractId: document.contractId, checksumVerified: verified },
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
