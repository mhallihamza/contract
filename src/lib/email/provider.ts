import type { EmailStatus, Language } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { LOG_EVENTS, logger } from "@/lib/logging";

/**
 * Email abstraction (§44).
 *
 * The MVP ships a console provider that renders the message into the server log
 * and stores it as an EmailMessage row, so the delivery path is observable
 * without pretending an e-mail left the platform. A production provider only
 * needs to implement `send`.
 */
export interface EmailMessageInput {
  to: string;
  subject: string;
  template: string;
  locale: Language;
  payload: Record<string, unknown>;
}

export interface EmailProvider {
  readonly name: string;
  readonly real: boolean;
  send(message: EmailMessageInput): Promise<{ status: EmailStatus; providerId: string | null; error: string | null }>;
}

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  readonly real = false;

  async send(message: EmailMessageInput) {
    const line = `[email:${message.template}] → ${message.to} · ${message.subject}`;
    logger.info(LOG_EVENTS.emailLogged, { to: message.to, template: message.template, subject: message.subject });
    console.log(line);
    return { status: "LOGGED" as EmailStatus, providerId: null, error: null };
  }
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  readonly real = true;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessageInput) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          from: this.from,
          to: message.to,
          subject: message.subject,
          html: `<pre style="font-family:system-ui;white-space:pre-wrap">${escapeHtml(
            JSON.stringify(message.payload, null, 2),
          )}</pre>`,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return { status: "FAILED" as EmailStatus, providerId: null, error: text.slice(0, 200) };
      }
      const payload = (await response.json()) as { id?: string };
      return { status: "SENT" as EmailStatus, providerId: payload.id ?? null, error: null };
    } catch (error) {
      logger.error(LOG_EVENTS.emailFailed, { to: message.to, error: String(error) });
      return { status: "FAILED" as EmailStatus, providerId: null, error: String(error) };
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const provider = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (provider === "resend" && apiKey) {
    cached = new ResendEmailProvider(apiKey, process.env.EMAIL_FROM?.trim() || "no-reply@example.ma");
  } else {
    cached = new ConsoleEmailProvider();
  }
  return cached;
}

export function setEmailProviderForTesting(provider: EmailProvider | null): void {
  cached = provider;
}

/** Sends an e-mail and records it. Never throws: notification failures are not business failures. */
export async function deliverEmail(input: EmailMessageInput) {
  const provider = getEmailProvider();
  const result = await provider.send(input).catch((error) => ({
    status: "FAILED" as EmailStatus,
    providerId: null,
    error: String(error),
  }));

  return db.emailMessage
    .create({
      data: {
        to: input.to,
        subject: input.subject,
        template: input.template,
        payload: input.payload as never,
        status: result.status,
        provider: provider.name,
        error: result.error,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    })
    .catch((error) => {
      logger.error(LOG_EVENTS.emailFailed, { to: input.to, error: String(error) });
      return null;
    });
}
