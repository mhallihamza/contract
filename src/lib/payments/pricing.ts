import type { PaymentType, RoutingRoute } from "@prisma/client";
import { SERVICE_PRICING, vatRate } from "@/lib/config";

/**
 * Service pricing (§27).
 *
 * Prices are always computed server-side from the routing decision and the
 * client's service choice. A client can never send an amount. The VAT is not
 * a choice either: its rate is configured here and applied on every checkout.
 */
export interface PriceBreakdownLine {
  key: "SELF_SERVICE" | "LAWYER_REVIEW" | "LAWYER_REQUIRED" | "SIGNATURE" | "VERIFICATION_ASSISTED";
  amount: number;
  labelFr: string;
  labelAr: string;
}

/** VAT as charged at checkout (on top of the HT service price). */
export interface VatBreakdown {
  rate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  labelFr: string;
  labelAr: string;
}

export interface PriceQuote {
  amount: number;
  currency: string;
  type: PaymentType | null;
  payable: boolean;
  lines: PriceBreakdownLine[];
  reason: string;
  /** Filled for payable quotes — the checkout charges `vat.total`, not `amount`. */
  vat?: VatBreakdown | null;
}

const LINES: Record<PriceBreakdownLine["key"], { labelFr: string; labelAr: string; amount: number }> = {
  SELF_SERVICE: {
    labelFr: "Préparation du contrat (autonomie)",
    labelAr: "إعداد العقد (ذاتي)",
    amount: SERVICE_PRICING.selfService,
  },
  VERIFICATION_ASSISTED: {
    labelFr: "Vérification assistée d'un document existant",
    labelAr: "تحقق آلي من وثيقة جاهزة",
    amount: SERVICE_PRICING.verificationAssisted,
  },
  LAWYER_REVIEW: { labelFr: "Revue par un avocat", labelAr: "مراجعة محامٍ", amount: SERVICE_PRICING.lawyerReview },
  LAWYER_REQUIRED: {
    labelFr: "Prestation juridique requise",
    labelAr: "خدمة قانونية إلزامية",
    amount: SERVICE_PRICING.lawyerRequired,
  },
  SIGNATURE: { labelFr: "Signature électronique", labelAr: "التوقيع الإلكتروني", amount: SERVICE_PRICING.signature },
};

export interface PriceQuoteInput {
  route: RoutingRoute;
  lawyerServiceSelected: boolean;
  signatureRequired: boolean;
  currency?: string;
}

export function quoteService(input: PriceQuoteInput): PriceQuote {
  const currency = input.currency ?? process.env.PAYMENT_CURRENCY?.trim() ?? "MAD";
  const keys: PriceBreakdownLine["key"][] = [];
  let type: PaymentType | null = null;
  let reason = "";

  switch (input.route) {
    case "SELF_SERVICE":
      keys.push("SELF_SERVICE");
      type = "SELF_SERVICE_CONTRACT";
      reason = "Preparation en autonomie : aucun avocat n'intervient.";
      break;
    case "LAWYER_OPTIONAL":
      if (input.lawyerServiceSelected) {
        keys.push("LAWYER_REVIEW");
        type = "LAWYER_REVIEW";
        reason = "Revue par un avocat demandée par le client.";
        if (input.signatureRequired) keys.push("SIGNATURE");
      } else {
        keys.push("SELF_SERVICE");
        type = "SELF_SERVICE_CONTRACT";
        reason = "Le client a choisi de finaliser sans avocat.";
      }
      break;
    case "LAWYER_REQUIRED":
      keys.push("LAWYER_REQUIRED");
      type = "LAWYER_REQUIRED_SERVICE";
      reason = "La revue par un avocat est prévue par les règles configurées.";
      if (input.signatureRequired) keys.push("SIGNATURE");
      break;
    case "LAWYER_SIGNATURE_REQUIRED":
      keys.push("LAWYER_REQUIRED", "SIGNATURE");
      type = "LAWYER_REQUIRED_SERVICE";
      reason = "Revue et signature requises par les règles configurées.";
      break;
    case "SPECIALIST_REQUIRED":
    case "UNSUPPORTED":
    case "ROUTING_UNDETERMINED":
      return {
        amount: 0,
        currency,
        type: null,
        payable: false,
        lines: [],
        reason:
          "Aucun paiement n'est possible : ce dossier doit d'abord être traité par un professionnel ou un administrateur.",
      };
    default:
      return { amount: 0, currency, type: null, payable: false, lines: [], reason: "Parcours inconnu." };
  }

  const lines: PriceBreakdownLine[] = [...new Set(keys)].map((key) => ({
    key,
    amount: LINES[key].amount,
    labelFr: LINES[key].labelFr,
    labelAr: LINES[key].labelAr,
  }));

  return {
    amount: lines.reduce((total, line) => total + line.amount, 0),
    currency,
    type,
    payable: true,
    lines,
    reason,
  };
}

/** Price of the signature ceremony alone (used when adding it later). */
export function signatureFee(): number {
  return SERVICE_PRICING.signature;
}

/** VAT on a price: HT subtotal in, full checkout breakdown out. */
export function withVat(
  subtotal: number,
  currency?: string,
  source: Record<string, string | undefined> = process.env,
): VatBreakdown {
  const rate = vatRate(source);
  const vatAmount = Math.round(subtotal * rate * 100) / 100;
  const ratePct = String(Math.round(rate * 100));
  return {
    rate,
    subtotal,
    vatAmount,
    total: Math.round((subtotal + vatAmount) * 100) / 100,
    currency: currency ?? process.env.PAYMENT_CURRENCY?.trim() ?? "MAD",
    labelFr: `TVA ${ratePct} %`,
    labelAr: `ضريبة القيمة المضافة ${ratePct}٪`,
  };
}

/** Fills the vat block of a quote; unpaid quotes keep `vat: null`. */
export function applyVat(
  quote: PriceQuote,
  source: Record<string, string | undefined> = process.env,
): PriceQuote {
  if (!quote.payable) return { ...quote, vat: null };
  return { ...quote, vat: withVat(quote.amount, quote.currency, source) };
}

/** The amount actually charged at checkout — HT price plus VAT. */
export function payableTotal(quote: PriceQuote): number {
  return quote.vat?.total ?? quote.amount;
}

export type VerificationTierChoice = "ASSISTED" | "LAWYER";

/**
 * Quote of the "check an existing document" journey (§8b).
 *
 * The assisted tier is the flat 79 DH automated check. The lawyer tier reuses
 * the standard lawyer-review price — a professional revises the file and the
 * payment is captured only after the lawyer validates.
 */
export function quoteVerification(input: { tier: VerificationTierChoice; currency?: string }): PriceQuote {
  const currency = input.currency ?? process.env.PAYMENT_CURRENCY?.trim() ?? "MAD";
  const lineKey: PriceBreakdownLine["key"] = input.tier === "ASSISTED" ? "VERIFICATION_ASSISTED" : "LAWYER_REVIEW";

  const lines: PriceBreakdownLine[] = [
    { key: lineKey, amount: LINES[lineKey].amount, labelFr: LINES[lineKey].labelFr, labelAr: LINES[lineKey].labelAr },
  ];

  return {
    amount: lines[0].amount,
    currency,
    type: input.tier === "ASSISTED" ? "VERIFICATION_ASSISTED" : "LAWYER_REVIEW",
    payable: true,
    lines,
    reason:
      input.tier === "ASSISTED"
        ? "Vérification automatisée d'un document existant : contrôle de complétude et de cohérence."
        : "Revue d'un document existant par un avocat, avec attestation séparée.",
  };
}
