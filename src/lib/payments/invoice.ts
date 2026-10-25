import "server-only";
import type { Payment } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { appConfig } from "@/lib/config";
import { logger, LOG_EVENTS } from "@/lib/logging";
import { renderPdf } from "@/lib/documents/pdf-renderer";
import { renderInvoiceBody, formatInvoiceNumber, INVOICE_PREFIX } from "./invoice-format";

/**
 * Invoices (§5, §26) — persistence side.
 *
 * Every captured payment carries a sequential, unique invoice number (the
 * legally meaningful part, stored on the Payment row); the PDF itself is
 * rendered deterministically from the row on demand — no duplicate storage of
 * personal data.
 */

/**
 * Assigns the invoice number of a captured payment. The sequential value comes
 * from a count of the year's existing numbers inside the update transaction;
 * the unique index is the real guard — a concurrent capture retries once.
 */
export async function issueInvoiceForPayment(paymentId: string): Promise<string | null> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, invoiceNumber: true },
  });
  if (!payment) return null;
  if (payment.invoiceNumber) return payment.invoiceNumber;
  if (payment.status !== "PAID") return null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const year = new Date().getFullYear();
    const prefix = `${INVOICE_PREFIX}-${year}-`;
    const issued = await db.$transaction(async (tx) => {
      const count = await tx.payment.count({ where: { invoiceNumber: { startsWith: prefix } } });
      const invoiceNumber = formatInvoiceNumber(year, count + 1);
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { invoiceNumber, invoiceIssuedAt: new Date() },
        select: { invoiceNumber: true },
      });
      return updated.invoiceNumber;
    });
    if (issued) {
      logger.info(LOG_EVENTS.paymentEvent, { paymentId, invoiceNumber: issued });
      await recordAudit({
        action: "INVOICE_ISSUED",
        entityType: "Payment",
        entityId: paymentId,
        metadata: { invoiceNumber: issued },
      });
      return issued;
    }
  }
  return null;
}

/** Full invoice PDF for a payment. Returns null when it cannot be issued yet. */
export async function renderInvoicePdfForPayment(payment: Payment): Promise<Buffer | null> {
  if (payment.status !== "PAID" || !payment.invoiceNumber) return null;

  const contract = payment.contractId
    ? await db.contract.findUnique({
        where: { id: payment.contractId },
        select: { reference: true, customerEmail: true, contractType: { select: { nameFr: true } } },
      })
    : null;
  const buyer = payment.userId
    ? await db.user.findUnique({ where: { id: payment.userId }, select: { fullName: true, email: true } })
    : null;

  const issuedAt = payment.invoiceIssuedAt ?? payment.paidAt ?? new Date();
  const body = renderInvoiceBody({
    invoiceNumber: payment.invoiceNumber,
    issuedAt,
    payment: {
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      paidAt: payment.paidAt,
      provider: payment.provider,
      metadata: payment.metadata,
    },
    caseReference: contract?.reference ?? null,
    caseTypeFr: contract?.contractType?.nameFr ?? null,
    buyerEmail: buyer?.email ?? contract?.customerEmail ?? null,
    buyerName: buyer?.fullName ?? null,
  });

  return renderPdf({
    title: `Facture ${payment.invoiceNumber}`,
    body,
    language: "fr",
    metadata: {
      reference: payment.invoiceNumber,
      subtitle: appConfig.invoice.legalName || appConfig.name,
      generatedAt: issuedAt,
    },
  });
}
