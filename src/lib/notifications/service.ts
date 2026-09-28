import type { Language, NotificationType } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { deliverEmail } from "@/lib/email/provider";
import { logger } from "@/lib/logging";

/**
 * Notification service (§44).
 *
 * Every user-facing event is recorded in-app, and the e-mail counterpart is
 * written through the e-mail provider abstraction (the MVP provider logs the
 * message and stores it as an EmailMessage row, so nothing pretends to leave the
 * platform). Notifications never throw: a delivery problem must not roll back a
 * legal workflow.
 */
export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  contractId?: string | null;
  locale?: "fr" | "ar";
  email?: {
    to: string;
    subject: string;
    template: string;
    payload: Record<string, unknown>;
  } | null;
}

export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    let emailMessageId: string | null = null;

    if (input.email) {
      const record = await deliverEmail({
        to: input.email.to,
        subject: input.email.subject,
        template: input.email.template,
        locale: (input.locale === "ar" ? "AR" : "FR") as Language,
        payload: input.email.payload,
      });
      emailMessageId = record?.id ?? null;
    }

    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "IN_APP",
        locale: (input.locale === "ar" ? "AR" : "FR") as Language,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        contractId: input.contractId ?? null,
        emailMessageId,
      },
    });

    logger.info("notification.created", {
      userId: input.userId,
      type: input.type,
      contractId: input.contractId ?? null,
      emailed: Boolean(input.email),
    });
  } catch (error) {
    logger.warn("notification.failed", {
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Unread badge count for the signed-in user. */
export async function unreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

/** Inbox of a user, newest first (the header badge links here). */
export async function listNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Marks every unread notification as read; returns how many rows changed. */
export async function markNotificationsRead(userId: string): Promise<number> {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
