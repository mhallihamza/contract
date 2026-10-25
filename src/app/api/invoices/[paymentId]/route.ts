import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit/logger";
import { getCurrentUser, roleAtLeast } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { logger } from "@/lib/logging";
import { resolveGuestRequest } from "@/lib/guest/session";
import { enforceRateLimit, RATE_RULES } from "@/lib/security/rate-limit";
import { issueInvoiceForPayment, renderInvoicePdfForPayment } from "@/lib/payments/invoice";

/**
 * Invoice download.
 *
 * The invoice follows the same authorization shape as a case document: the
 * payer, the case's client, the assigned lawyer, a legal reviewer — or, before
 * any account exists, the guest session that owns the case. A payment that was
 * captured but whose numbering failed at settlement is issued lazily here.
 */
export async function GET(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const limited = enforceRateLimit(request, "invoice-download", RATE_RULES.documentDownload);
  if (limited) return limited;

  const user = await getCurrentUser();
  const { paymentId } = await context.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          select: { id: true, clientId: true, assignedLawyerId: true, guestSessionId: true, reference: true },
        },
      },
    });
    if (!payment) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    let guest: Awaited<ReturnType<typeof resolveGuestRequest>> = null;
    if (!user) {
      const url = new URL(request.url);
      guest = await resolveGuestRequest(url.searchParams.get("token"));
      if (!guest) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const allowed = user
      ? payment.userId === user.id ||
        payment.contract?.clientId === user.id ||
        payment.contract?.assignedLawyerId === user.id ||
        roleAtLeast(user.role, "LEGAL_REVIEWER")
      : Boolean(payment.contract?.guestSessionId && payment.contract.guestSessionId === guest!.id);

    if (!allowed) {
      logger.warn("invoice.download_denied", { paymentId, userId: user?.id ?? null });
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (payment.status === "PAID" && !payment.invoiceNumber) {
      await issueInvoiceForPayment(payment.id);
    }

    const bytes = await renderInvoicePdfForPayment(payment);
    if (!bytes) {
      return NextResponse.json({ error: "INVOICE_NOT_AVAILABLE" }, { status: 409 });
    }

    await recordAudit({
      action: "INVOICE_DOWNLOADED",
      entityType: "Payment",
      entityId: payment.id,
      actorId: user ? user.id : null,
      actorRole: user ? user.role : "CLIENT",
      metadata: {
        invoiceNumber: payment.invoiceNumber,
        contractId: payment.contractId,
        ...(user ? {} : { guestSessionId: guest!.id }),
      },
    });

    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-length": String(bytes.byteLength),
        "content-disposition": `attachment; filename="facture-${payment.invoiceNumber}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    logger.error("invoice.download_failed", {
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "UNEXPECTED_ERROR" }, { status: 500 });
  }
}
