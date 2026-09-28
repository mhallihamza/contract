import type { AuditAction, Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { logger } from "@/lib/logging";

/**
 * Audit trail (§25).
 *
 * The only writer in the application; there is deliberately no update or delete
 * helper — audit rows are append-only by construction. Business operations must
 * never fail because logging failed, so failures are logged and swallowed.
 */

export interface AuditInput {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorRole?: UserRole | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Request metadata used for audit rows (best-effort; never throws). */
export async function requestMetadata(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ipAddress: forwarded ? forwarded.split(",")[0]!.trim() : h.get("x-real-ip"),
      userAgent: h.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
