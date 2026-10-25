import type { RoutingRoute } from "@prisma/client";
import { applyVat, quoteService, type PriceQuote } from "@/lib/payments/pricing";

/**
 * Service offers derived from the routing decision (§15, §18).
 *
 * The client never chooses the workflow: the routing engine decides whether a
 * lawyer is needed, and this module only exposes what that decision allows. A
 * `LAWYER_REQUIRED` case has no self-service offer at all — the UI cannot render
 * one, because it does not exist in the returned set. Quotes carry the applied
 * VAT so the checkout can show the tax and the total actually charged.
 */

export type ServiceOfferKey = "SELF_SERVICE" | "LAWYER_REVIEW" | "LAWYER_REQUIRED" | "SIGNATURE";

export interface ServiceOffer {
  key: ServiceOfferKey;
  /** Whether the client may pick this option (LAWYER_OPTIONAL → yes). */
  selectable: boolean;
  /** Whether the price already includes the optional lawyer review. */
  includesLawyer: boolean;
  includesSignature: boolean;
  quote: PriceQuote;
}

export interface ServiceOfferSet {
  route: RoutingRoute;
  /** Short, honest explanation of *why* the offer set looks like this. */
  reasonCode:
    | "SELF_SERVICE_ONLY"
    | "CHOICE_LAWYER_REVIEW"
    | "LAWYER_REQUIRED"
    | "LAWYER_AND_SIGNATURE_REQUIRED"
    | "HUMAN_REVIEW_FIRST"
    | "NOT_PAYABLE";
  offers: ServiceOffer[];
  /** True when the client has no meaningful choice (single mandatory path). */
  mandatory: boolean;
  /** True when nothing can be paid yet: a human must handle the case first. */
  blocked: boolean;
}

export interface ServiceOfferInput {
  route: RoutingRoute;
  /** Client's choice on a LAWYER_OPTIONAL case (ignored elsewhere). */
  lawyerServiceSelected?: boolean;
  currency?: string;
}

function offer(
  key: ServiceOfferKey,
  input: { selectable: boolean; includesLawyer: boolean; includesSignature: boolean },
  quoteInput: { route: RoutingRoute; lawyerServiceSelected: boolean; signatureRequired: boolean; currency?: string },
): ServiceOffer {
  return {
    key,
    selectable: input.selectable,
    includesLawyer: input.includesLawyer,
    includesSignature: input.includesSignature,
    quote: applyVat(quoteService(quoteInput)),
  };
}

export function buildServiceOffers(input: ServiceOfferInput): ServiceOfferSet {
  const currency = input.currency;

  switch (input.route) {
    case "SELF_SERVICE":
      return {
        route: input.route,
        reasonCode: "SELF_SERVICE_ONLY",
        mandatory: true,
        blocked: false,
        offers: [
          offer(
            "SELF_SERVICE",
            { selectable: false, includesLawyer: false, includesSignature: false },
            { route: "SELF_SERVICE", lawyerServiceSelected: false, signatureRequired: false, currency },
          ),
        ],
      };

    case "LAWYER_OPTIONAL":
      return {
        route: input.route,
        reasonCode: "CHOICE_LAWYER_REVIEW",
        mandatory: false,
        blocked: false,
        offers: [
          offer(
            "SELF_SERVICE",
            { selectable: true, includesLawyer: false, includesSignature: false },
            { route: "LAWYER_OPTIONAL", lawyerServiceSelected: false, signatureRequired: false, currency },
          ),
          offer(
            "LAWYER_REVIEW",
            { selectable: true, includesLawyer: true, includesSignature: false },
            { route: "LAWYER_OPTIONAL", lawyerServiceSelected: true, signatureRequired: false, currency },
          ),
        ],
      };

    case "LAWYER_REQUIRED":
      return {
        route: input.route,
        reasonCode: "LAWYER_REQUIRED",
        mandatory: true,
        blocked: false,
        offers: [
          offer(
            "LAWYER_REQUIRED",
            { selectable: false, includesLawyer: true, includesSignature: false },
            { route: "LAWYER_REQUIRED", lawyerServiceSelected: true, signatureRequired: false, currency },
          ),
        ],
      };

    case "LAWYER_SIGNATURE_REQUIRED":
      return {
        route: input.route,
        reasonCode: "LAWYER_AND_SIGNATURE_REQUIRED",
        mandatory: true,
        blocked: false,
        offers: [
          offer(
            "LAWYER_REQUIRED",
            { selectable: false, includesLawyer: true, includesSignature: true },
            { route: "LAWYER_SIGNATURE_REQUIRED", lawyerServiceSelected: true, signatureRequired: true, currency },
          ),
        ],
      };

    default:
      // SPECIALIST_REQUIRED | UNSUPPORTED | ROUTING_UNDETERMINED — and, defensively,
      // any route added later without a product decision attached to it.
      return {
        route: input.route,
        reasonCode: input.route === "SPECIALIST_REQUIRED" ? "HUMAN_REVIEW_FIRST" : "NOT_PAYABLE",
        mandatory: true,
        blocked: true,
        offers: [],
      };
  }
}

/** The only accepted value of the client's choice for a given route. */
export function resolveOfferChoice(
  offers: ServiceOfferSet,
  lawyerServiceSelected: boolean,
): { accepted: boolean; reason: string } {
  if (offers.blocked) return { accepted: false, reason: "ROUTE_NOT_PAYABLE" };
  if (offers.route === "LAWYER_OPTIONAL") return { accepted: true, reason: "CLIENT_CHOICE" };
  const mandatoryLawyer = offers.offers.some((candidate) => candidate.key !== "SELF_SERVICE");
  if (mandatoryLawyer && !lawyerServiceSelected) return { accepted: false, reason: "LAWYER_REQUIRED_BY_ROUTE" };
  if (!mandatoryLawyer && lawyerServiceSelected) return { accepted: false, reason: "SELF_SERVICE_ONLY" };
  return { accepted: true, reason: "ROUTE_DECIDES" };
}
