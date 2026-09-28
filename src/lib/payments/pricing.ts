import type { PaymentType, RoutingRoute } from "@prisma/client";
import { SERVICE_PRICING } from "@/lib/config";

/**
 * Service pricing (§27).
 *
 * Prices are always computed server-side from the routing decision and the
 * client's service choice. A client can never send an amount.
 */
export interface PriceBreakdownLine {
  key: "SELF_SERVICE" | "LAWYER_REVIEW" | "LAWYER_REQUIRED" | "SIGNATURE";
  amount: number;
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
}

const LINES: Record<PriceBreakdownLine["key"], { labelFr: string; labelAr: string; amount: number }> = {
  SELF_SERVICE: {
    labelFr: "Préparation du contrat (autonomie)",
    labelAr: "إعداد العقد (ذاتي)",
    amount: SERVICE_PRICING.selfService,
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
