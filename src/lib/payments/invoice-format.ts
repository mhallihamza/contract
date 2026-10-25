import { appConfig } from "@/lib/config";

/**
 * Invoice formatting (§5) — deliberately pure and testable, no DB, no
 * server-only boundary. The numbering, the VAT arithmetic and the identity
 * gaps are all decided here; `payments/invoice.ts` wraps it with persistence.
 */

export const INVOICE_PREFIX = "WQI";

/** Pure numbering: WQI-YYYY-NNNN, zero-padded to four digits. */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `${INVOICE_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
}

const PLACEHOLDER = "(à compléter)";

function sellerLine(label: string, value: string): string {
  return `${label} : ${value || PLACEHOLDER}`;
}

export interface InvoiceDocumentInput {
  invoiceNumber: string;
  issuedAt: Date;
  payment: {
    id: string;
    amount: number;
    currency: string;
    paidAt: Date | null;
    provider: string;
    metadata: unknown;
  };
  caseReference: string | null;
  caseTypeFr: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
}

interface InvoiceMetadata {
  lines?: Array<{ labelFr?: string; amount?: number }>;
  vat?: { subtotal?: number; vatAmount?: number; total?: number; labelFr?: string; rate?: number } | null;
}

/**
 * Builds the human body of the invoice. Seller identity comes from the
 * environment (appConfig.invoice): a field the operator has not configured
 * prints as an explicit gap, never as invented data.
 */
export function renderInvoiceBody(input: InvoiceDocumentInput): string {
  const metadata: InvoiceMetadata =
    typeof input.payment.metadata === "object" && input.payment.metadata !== null
      ? (input.payment.metadata as InvoiceMetadata)
      : {};

  const money = (value: number) => `${value.toFixed(2)} ${input.payment.currency}`;

  const seller = appConfig.invoice;
  const lines: string[] = [
    `Facture ${input.invoiceNumber}`,
    `Date d'émission : ${input.issuedAt.toLocaleDateString("fr-MA")}`,
    "",
    "— Émetteur —",
    `Raison sociale : ${seller.legalName || appConfig.name}`,
  ];
  if (seller.address || seller.city) {
    lines.push(`Adresse : ${seller.address || PLACEHOLDER}${seller.city ? `, ${seller.city}` : ""}`);
  }
  lines.push(
    sellerLine("ICE", seller.ice),
    sellerLine("RC", seller.rc),
    sellerLine("Identifiant fiscal", seller.taxId),
    sellerLine("Courriel", seller.email),
    "",
    "— Client —",
  );
  if (input.buyerName) lines.push(`Nom : ${input.buyerName}`);
  lines.push(`Courriel : ${input.buyerEmail || PLACEHOLDER}`, "", "— Objet —");
  if (input.caseReference) {
    lines.push(`Dossier ${input.caseReference}${input.caseTypeFr ? ` — ${input.caseTypeFr}` : ""}`);
  } else {
    lines.push(PLACEHOLDER);
  }
  lines.push("", "— Détail —");

  const quoteLines = Array.isArray(metadata?.lines) ? metadata.lines : [];
  if (quoteLines.length > 0) {
    for (const line of quoteLines) {
      if (typeof line.amount === "number") {
        lines.push(`${line.labelFr ?? "Prestation"} : ${money(line.amount)} HT`);
      }
    }
  } else {
    lines.push(`Prestation : ${money(input.payment.amount)} HT`);
  }

  const vat = metadata?.vat ?? null;
  if (vat && typeof vat.vatAmount === "number" && typeof vat.subtotal === "number") {
    lines.push(
      `Total HT : ${money(vat.subtotal)}`,
      `${vat.labelFr ?? "TVA"} : ${money(vat.vatAmount)}`,
      `Total TTC : ${money(vat.total ?? input.payment.amount)}`,
    );
  } else {
    lines.push(`Total : ${money(input.payment.amount)}`);
  }

  lines.push(
    "",
    `Règlement : ${input.payment.provider}${input.payment.paidAt ? ` — encaissé le ${input.payment.paidAt.toLocaleDateString("fr-MA")}` : ""}`,
    "",
    "Document généré par la plateforme, à valider selon votre situation ; il ne remplace pas un conseil juridique.",
  );

  return lines.join("\n");
}
