import type { NotificationType } from "@prisma/client";
import { deliverEmail } from "@/lib/email/provider";
import { guestOrderLink } from "@/lib/guest/session";
import { logger } from "@/lib/logging";
import { notifyUser } from "./service";

/**
 * Case-owner notifications (§40, §44).
 *
 * A case is owned either by a signed-in client (in-app inbox) or by an anonymous
 * guest session (e-mail with a signed dossier link they can open without an
 * account). Business services call this helper instead of `notifyUser`, so a
 * catalogue-first visitor is never silently forgotten — and never has to create
 * an account to learn what happened to their dossier.
 */
export interface CaseOwnerTarget {
  id: string;
  reference: string;
  clientId: string | null;
  customerEmail: string | null;
  guestSessionId: string | null;
}

export interface NotifyCaseOwnerInput {
  contract: CaseOwnerTarget;
  type: NotificationType;
  title: string;
  body: string;
  /** In-app link for signed-in clients. */
  href?: string | null;
  locale?: "fr" | "ar";
  emailSubject?: string;
  emailTemplate?: string;
  emailPayload?: Record<string, unknown>;
  /** Where to send guest mail when no e-mail is stored on the case yet. */
  guestEmail?: string | null;
}

export async function notifyCaseOwner(input: NotifyCaseOwnerInput): Promise<void> {
  const locale = input.locale ?? "fr";

  if (input.contract.clientId) {
    await notifyUser({
      userId: input.contract.clientId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      contractId: input.contract.id,
      locale,
      email: input.guestEmail
        ? {
            to: input.guestEmail,
            subject: input.emailSubject ?? input.title,
            template: input.emailTemplate ?? "case-update",
            payload: input.emailPayload ?? {},
          }
        : null,
    });
    return;
  }

  const to = input.guestEmail ?? input.contract.customerEmail;
  if (!to) {
    logger.info("notification.skipped_no_recipient", {
      contractId: input.contract.id,
      type: input.type,
      reason: "guest_without_email",
    });
    return;
  }

  // The guest has no account: the link is a stateless, signed dossier link that
  // keeps working after the e-mail has left the platform (§8, §38).
  const link = input.contract.guestSessionId ? guestOrderLink(input.contract.guestSessionId) : null;

  await deliverEmail({
    to,
    subject: input.emailSubject ?? input.title,
    template: input.emailTemplate ?? "case-update",
    locale: locale === "ar" ? "AR" : "FR",
    payload: {
      reference: input.contract.reference,
      title: input.title,
      body: input.body,
      link,
      inAppHref: input.href ?? null,
      ...(input.emailPayload ?? {}),
    },
  });
}
