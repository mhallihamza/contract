import "server-only";
import type { ContractStatus, FieldType, RoutingRoute } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { logger } from "@/lib/logging";
import {
  partyRoleLabel,
  partyRolesFor,
  type FieldGroup,
  type FieldOption,
} from "@/lib/contracts/field-catalog";
import { rowsToStructuredCase } from "@/lib/contracts/fields";
import type { CaseActor, GuestActor } from "@/lib/contracts/actor";
import { buildContractPreview, type ContractPreview } from "@/lib/contracts/preview";
import {
  buildQuestionSetFor,
  cancelContract,
  createContractCase,
  routeContract,
  saveContractAnswers,
  selectContractService,
  type SelectServiceResult,
} from "@/lib/contracts/service";
import { settleContractPaymentInSandbox, startContractPayment, type StartPaymentResult } from "@/lib/contracts/payments";
import { buildServiceOffers, type ServiceOfferKey, type ServiceOfferSet } from "@/lib/contracts/service-offers";
import { finalizeContract, type FinalizeResult } from "@/lib/contracts/drafting";
import { buildOrderTimeline, deriveOrderStatus, type OrderStatus, type TimelineStep } from "@/lib/orders/status";
import { issueGuestSession, resolveGuestRequest, setGuestCookie, type GuestSessionSummary } from "./session";
import type { GuestPartyInput } from "./validation";

/**
 * Guest case orchestration (§4, §8, §14, §37, §48).
 *
 * One module owns the public journey so pages stay thin and every step reuses the
 * same domain services as the authenticated workspace: the routing engine decides,
 * prices come from `quoteService`, and the state machine guards the lifecycle. The
 * only thing that differs is the *owner*: an anonymous, token-scoped session
 * instead of a user account.
 */

export interface GuestQuestionField {
  key: string;
  labelFr: string;
  labelAr: string;
  type: FieldType;
  required: boolean;
  group: FieldGroup;
  helpFr?: string;
  helpAr?: string;
  options?: FieldOption[];
  min?: number;
  max?: number;
}

export interface GuestQuestionSection {
  group: FieldGroup;
  labelFr: string;
  labelAr: string;
  fields: GuestQuestionField[];
}

export interface GuestPartyRoleView {
  role: string;
  labelFr: string;
  labelAr: string;
}

export interface GuestDocumentView {
  id: string;
  filename: string;
  documentType: string;
  version: number;
  immutable: boolean;
  createdAt: Date;
}

export interface GuestCaseView {
  contractId: string;
  reference: string;
  status: ContractStatus;
  route: RoutingRoute | null;
  contractType: { code: string; slug: string; nameFr: string; nameAr: string };
  language: "fr" | "ar";
  questionSections: GuestQuestionSection[];
  missingKeys: string[];
  parties: {
    role: string;
    labelFr: string;
    labelAr: string;
    fullName: string;
    partyType: string;
    address: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
  }[];
  /** Answers already saved, keyed by field key (used to prefill the wizard). */
  answers: Record<string, unknown>;
  partyRoles: GuestPartyRoleView[];
  preview: ContractPreview | null;
  offers: ServiceOfferSet | null;
  priceAmount: number | null;
  currency: string;
  customerEmail: string | null;
  payment: { id: string; status: string; amount: number; currency: string } | null;
  orderStatus: OrderStatus;
  timeline: TimelineStep[];
  documents: GuestDocumentView[];
  /** Latest routing decision snapshot — reason, codes and rule gaps (§11). */
  decision: {
    reason: string;
    reasonCodes: string[];
    missingRuleContext: string[];
    decidedAt: Date;
  } | null;
  /** Whether a lawyer engagement exists on this case (drives service selection UI). */
  lawyerRequested: boolean;
  /** Offer key pre-picked on a marketing entry point, applied once after routing. */
  preselectedOffer: ServiceOfferKey | null;
  routedAt: Date | null;
  isFinal: boolean;
}

export function guestActorFor(session: GuestSessionSummary & { contractId: string }): GuestActor {
  return {
    kind: "guest",
    sessionId: session.id,
    contractId: session.contractId,
    email: session.email,
    locale: session.locale,
  };
}

export interface GuestCaseContext {
  session: GuestSessionSummary & { contractId: string };
  actor: GuestActor;
  view: GuestCaseView;
}

/** Resolves a token (or the guest cookie) and loads the owned case. */
export async function requireGuestCase(token?: string | null): Promise<GuestCaseContext> {
  const session = await resolveGuestRequest(token ?? null);
  if (!session) throw new Error("GUEST_SESSION_NOT_FOUND");
  if (!session.contractId) throw new Error("GUEST_CASE_NOT_STARTED");

  const context = { session: session as GuestSessionSummary & { contractId: string }, actor: guestActorFor(session as GuestSessionSummary & { contractId: string }) };
  const view = await loadGuestCase(context.session);
  if (!view) throw new Error("GUEST_CASE_NOT_FOUND");
  return { ...context, view };
}

export interface StartGuestIntakeParams {
  slug: string;
  locale: "fr" | "ar";
  /**
   * Service offer key pre-picked on a marketing entry point. Stored on the
   * session and applied once after routing — only if the routing engine's
   * decision allows that offer, so the visitor never picks the route.
   */
  tier?: string;
}

export interface StartGuestIntakeResult {
  token: string;
  contractId: string;
  reference: string;
  expiresAt: Date;
  redirectUrl: string;
}

/**
 * Catalogue CTA → anonymous case (§4).
 *
 * No account, no password, no profile: a session is issued, the case is created
 * from the *server-side* contract type resolved through its slug, and the token is
 * stored in an httpOnly cookie while also living in the URL.
 */
/**
 * Marketing tier → offer key map. Deliberately narrow: only the lawyer-review
 * offer can be pre-picked from a pricing card. Verification tiers belong to
 * the dedicated verification journey, not to the create wizard.
 */
const PRESELECTABLE_TIERS: Record<string, ServiceOfferKey> = {
  avocat: "LAWYER_REVIEW",
};

/** Validates a marketing tier and returns the offer key, or null when unknown. */
export function preselectedOfferFor(tier: string | undefined | null): ServiceOfferKey | null {
  if (!tier) return null;
  return PRESELECTABLE_TIERS[tier] ?? null;
}

export async function startGuestIntake(params: StartGuestIntakeParams): Promise<StartGuestIntakeResult> {
  const contractType = await db.contractType.findFirst({
    where: { slug: params.slug, active: true, status: "ACTIVE" },
    select: { id: true, code: true, nameFr: true },
  });
  if (!contractType) throw new Error("CONTRACT_TYPE_UNRESOLVED");

  const preselectedOffer = preselectedOfferFor(params.tier);

  const { token, sessionId, expiresAt } = await issueGuestSession({
    contractTypeId: contractType.id,
    locale: params.locale,
    preselectedOffer,
  });

  const created = await createContractCase({
    actor: { kind: "guest", sessionId, contractId: "", email: null, locale: params.locale },
    contractTypeCode: contractType.code,
    locale: params.locale,
  });

  // The actor is bound to the case it owns from now on (§38).
  await setGuestCookie(token, expiresAt);

  logger.info("guest.intake_started", {
    sessionId,
    contractId: created.contractId,
    contractTypeCode: contractType.code,
  });

  return {
    token,
    contractId: created.contractId,
    reference: created.reference,
    expiresAt,
    redirectUrl: `/start/${token}`,
  };
}

/** Loads everything the public pages need for one anonymous case. */
export async function loadGuestCase(session: GuestSessionSummary & { contractId: string }): Promise<GuestCaseView | null> {
  const contract = await db.contract.findUnique({
    where: { id: session.contractId },
    include: {
      contractType: true,
      fields: true,
      parties: { orderBy: { position: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      lawyerRequest: true,
      routingDecisions: { orderBy: { decidedAt: "desc" }, take: 1 },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!contract) return null;

  const questionSet = await buildQuestionSetFor(contract.id, contract.contractType);
  const preview = await buildContractPreview(contract.id);

  const offers = contract.route
    ? buildServiceOffers({
        route: contract.route,
        lawyerServiceSelected: Boolean(contract.lawyerRequest),
        currency: contract.priceCurrency,
      })
    : null;

  const paidPayment = contract.payments.find((payment) => payment.status === "PAID") ?? null;
  const latestPayment = paidPayment ?? contract.payments[0] ?? null;
  const signatureRequired =
    contract.route === "LAWYER_SIGNATURE_REQUIRED" || Boolean(contract.lawyerRequest?.requiresSignature);

  return {
    contractId: contract.id,
    reference: contract.reference,
    status: contract.status,
    route: contract.route,
    contractType: {
      code: contract.contractType.code,
      slug: contract.contractType.slug,
      nameFr: contract.contractType.nameFr,
      nameAr: contract.contractType.nameAr,
    },
    language: contract.language === "AR" ? "ar" : "fr",
    questionSections: questionSet.sections.map((section) => ({
      group: section.group,
      labelFr: section.label.fr,
      labelAr: section.label.ar,
      fields: section.specs.map((spec) => ({
        key: spec.key,
        labelFr: spec.labelFr,
        labelAr: spec.labelAr,
        type: spec.type,
        required: spec.required,
        group: spec.group,
        helpFr: spec.helpFr,
        helpAr: spec.helpAr,
        options: spec.options,
        min: spec.min,
        max: spec.max,
      })),
    })),
    missingKeys: questionSet.missingKeys,
    parties: contract.parties.map((party) => ({
      role: party.role,
      labelFr: partyRoleLabel(party.role, "fr"),
      labelAr: partyRoleLabel(party.role, "ar"),
      fullName: party.fullName,
      partyType: party.partyType,
      address: party.address,
      city: party.city,
      email: party.email,
      phone: party.phone,
    })),
    partyRoles: partyRolesFor(contract.contractType.code).map((role) => ({
      role,
      labelFr: partyRoleLabel(role, "fr"),
      labelAr: partyRoleLabel(role, "ar"),
    })),
    answers: rowsToStructuredCase(contract.fields) as unknown as Record<string, unknown>,
    preview,
    offers,
    priceAmount: contract.priceAmount === null ? null : Number(contract.priceAmount),
    currency: contract.priceCurrency,
    customerEmail: contract.customerEmail,
    payment: latestPayment
      ? {
          id: latestPayment.id,
          status: latestPayment.status,
          amount: Number(latestPayment.amount),
          currency: latestPayment.currency,
        }
      : null,
    orderStatus: deriveOrderStatus({
      contractStatus: contract.status,
      route: contract.route,
      paymentStatus: latestPayment?.status ?? null,
    }),
    timeline: buildOrderTimeline({
      contractStatus: contract.status,
      route: contract.route,
      hasDraft: contract.versions.length > 0,
      hasLawyerRequest: Boolean(contract.lawyerRequest),
      signatureRequired,
    }),
    documents: contract.documents
      .filter((document) =>
        ["DRAFT_CONTRACT", "LAWYER_REVISED_DRAFT", "FINAL_CONTRACT", "SIGNED_CONTRACT"].includes(
          document.documentType,
        ),
      )
      .map((document) => ({
        id: document.id,
        filename: document.filename,
        documentType: document.documentType,
        version: document.version,
        immutable: document.immutable,
        createdAt: document.createdAt,
      })),
    decision: contract.routingDecisions[0]
      ? {
          reason: contract.routingDecisions[0].reason,
          reasonCodes: [...contract.routingDecisions[0].reasonCodes],
          missingRuleContext: [...contract.routingDecisions[0].missingRuleContext],
          decidedAt: contract.routingDecisions[0].decidedAt,
        }
      : null,
    lawyerRequested: Boolean(contract.lawyerRequest),
    preselectedOffer: preselectedOfferFor(session.preselectedOffer),
    routedAt: contract.routedAt,
    isFinal: contract.status === "FINAL",
  };
}

/** Saves the questionnaire answers for the guest case (§9, §10). */
export async function saveGuestAnswers(params: {
  token: string;
  values: Record<string, unknown>;
}): Promise<{ missingKeys: string[]; status: string }> {
  const { actor, view } = await requireGuestCase(params.token);
  if (view.isFinal) throw new Error("CASE_ALREADY_FINAL");
  return saveContractAnswers({ contractId: view.contractId, actor, values: params.values });
}

/**
 * Replaces the parties of the case (§20).
 *
 * Parties are mandatory facts: no draft can be produced without at least two
 * distinct roles, so the wizard collects them explicitly instead of hoping the
 * model invents them.
 */
export async function saveGuestParties(params: {
  token: string;
  parties: GuestPartyInput[];
}): Promise<{ count: number }> {
  const { actor, view } = await requireGuestCase(params.token);
  if (view.isFinal) throw new Error("CASE_ALREADY_FINAL");

  const seen = new Set<string>();
  const rows = params.parties
    .filter((party) => party.fullName.trim().length > 1)
    .filter((party) => {
      const key = `${party.role}:${party.fullName.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((party, index) => ({
      contractId: view.contractId,
      role: party.role as never,
      partyType: party.partyType,
      fullName: party.fullName.trim(),
      companyName: party.companyName?.trim() || null,
      companyTaxId: party.companyTaxId?.trim() || null,
      nationalId: party.nationalId?.trim() || null,
      representative: party.representative?.trim() || null,
      address: party.address?.trim() || null,
      city: party.city?.trim() || null,
      email: party.email?.trim() || null,
      phone: party.phone?.trim() || null,
      position: index,
    }));

  if (rows.length < 2) throw new Error("PARTIES_INCOMPLETE");

  await db.$transaction(async (tx) => {
    await tx.contractParty.deleteMany({ where: { contractId: view.contractId } });
    await tx.contractParty.createMany({ data: rows });
  });

  logger.info("guest.parties_saved", { contractId: view.contractId, count: rows.length, session: actor.sessionId });
  return { count: rows.length };
}

/** What the public pages need from a routing result (no fabricated evaluations). */
export interface GuestRoutingOutcome {
  route: RoutingRoute;
  decisionId: string;
  status: ContractStatus;
  price: number | null;
  currency: string;
  reason: string;
  reasonCodes: string[];
  matchedRuleIds: string[];
  legalSourceIds: string[];
  missingRuleContext: string[];
  alreadyDecided: boolean;
}

/**
 * Runs the deterministic router (§11) exactly once per case.
 *
 * Calling it again returns the stored decision instead of re-running the engine:
 * routing is auditable history, not a value to be recomputed on every render.
 */
export async function routeGuestCase(params: { token: string }): Promise<GuestRoutingOutcome> {
  const { actor, view } = await requireGuestCase(params.token);

  const existing = await db.routingDecision.findFirst({
    where: { contractId: view.contractId },
    orderBy: { decidedAt: "desc" },
  });

  const routable = ["DRAFT", "INFORMATION_REQUIRED", "READY_FOR_ROUTING", "MANUAL_REVIEW_REQUIRED"].includes(
    view.status,
  );

  if (existing && !routable) {
    return {
      route: existing.route,
      decisionId: existing.id,
      status: view.status,
      price: view.priceAmount,
      currency: view.currency,
      reason: existing.reason,
      reasonCodes: existing.reasonCodes,
      matchedRuleIds: existing.matchedRuleIds,
      legalSourceIds: existing.legalSourceIds,
      missingRuleContext: existing.missingRuleContext,
      alreadyDecided: true,
    };
  }

  const outcome = await routeContract({ contractId: view.contractId, actor });

  // A tier pre-picked on a marketing page is applied exactly once, right after
  // routing — and only when the engine's decision actually allows that offer
  // (a selectable LAWYER_REVIEW offer). The route itself is never overridden.
  if (view.preselectedOffer) {
    await applyPreselectedService(params.token, actor, view.preselectedOffer);
  }

  return {
    route: outcome.decision.route,
    decisionId: outcome.decisionId,
    status: outcome.status as ContractStatus,
    price: outcome.price,
    currency: outcome.currency,
    reason: outcome.decision.reason,
    reasonCodes: [...outcome.decision.reasonCodes],
    matchedRuleIds: outcome.decision.matchedRuleIds,
    legalSourceIds: outcome.decision.legalSourceIds,
    missingRuleContext: outcome.decision.missingRuleContext,
    alreadyDecided: false,
  };
}

/**
 * Applies a pre-picked offer when the routed decision allows it. Fails soft:
 * if the offer is not offered or not selectable for this route, the visitor
 * simply chooses at checkout like every other case.
 */
async function applyPreselectedService(
  token: string,
  actor: GuestActor,
  offerKey: ServiceOfferKey,
): Promise<void> {
  try {
    const { view: fresh } = await requireGuestCase(token);
    const offer = fresh.offers?.offers.find((entry) => entry.key === offerKey);
    if (offer?.selectable && !fresh.lawyerRequested) {
      await selectContractService({ contractId: fresh.contractId, actor, offerKey });
      logger.info("guest.preselected_offer_applied", { contractId: fresh.contractId, offerKey });
    }
  } catch (error) {
    logger.warn("guest.preselected_offer_skipped", {
      offerKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Records the client's service choice (never the price, never the lawyer). */
export async function selectGuestService(params: {
  token: string;
  offerKey: ServiceOfferKey;
}): Promise<SelectServiceResult> {
  const { actor, view } = await requireGuestCase(params.token);
  return selectContractService({ contractId: view.contractId, actor, offerKey: params.offerKey });
}

/** Stores the e-mail before payment (§16) — no account is created. */
export async function setGuestEmail(params: { token: string; email: string }): Promise<void> {
  const { session, view } = await requireGuestCase(params.token);
  const email = params.email.trim().toLowerCase();

  await db.$transaction([
    db.contract.update({ where: { id: view.contractId }, data: { customerEmail: email } }),
    db.guestSession.update({ where: { id: session.id }, data: { email } }),
  ]);

  logger.info("guest.email_set", { contractId: view.contractId, sessionId: session.id });
}

/** Creates the pending payment server-side (amount from the pricing engine). */
export async function startGuestPayment(params: { token: string }): Promise<StartPaymentResult> {
  const { session, actor, view } = await requireGuestCase(params.token);
  if (!view.customerEmail) throw new Error("EMAIL_REQUIRED_BEFORE_PAYMENT");
  logger.info("guest.payment_starting", { contractId: view.contractId, sessionId: session.id });
  return startContractPayment({ contractId: view.contractId, actor });
}

export interface GuestSettlementResult {
  paid: boolean;
  draftGenerated: boolean;
  lawyerRequested: boolean;
  lawyerAssigned: boolean;
  finalized: boolean;
  finalization: FinalizeResult | null;
  message: string;
}

/**
 * Settles the sandbox payment exactly like a provider webhook would (§26, §38).
 *
 * A self-service dossier is finalised immediately — the client paid for a
 * finished document, not for a draft. A dossier that requires a lawyer stops at
 * the review stage, where a human takes over.
 */
export async function settleGuestPayment(params: { token: string }): Promise<GuestSettlementResult> {
  const { actor, view } = await requireGuestCase(params.token);

  const settlement = await settleContractPaymentInSandbox({ contractId: view.contractId, actor });
  if (!settlement.paid) return { ...settlement, finalized: false, finalization: null };

  const contract = await db.contract.findUniqueOrThrow({
    where: { id: view.contractId },
    select: { status: true, route: true },
  });

  const selfService = contract.route === "SELF_SERVICE" || contract.route === "LAWYER_OPTIONAL";
  const lawyerInvolved = settlement.lawyerRequested || settlement.lawyerAssigned;

  if (selfService && !lawyerInvolved && contract.status === "DRAFT_READY") {
    const finalization = await finalizeContract({ contractId: view.contractId, actor });
    logger.info("guest.case_finalized", {
      contractId: view.contractId,
      versionNumber: finalization.versionNumber,
      documentId: finalization.documentId,
    });
    return { ...settlement, finalized: true, finalization };
  }

  return { ...settlement, finalized: false, finalization: null };
}

/** Client-initiated cancellation of an unfinished dossier. */
export async function cancelGuestCase(params: { token: string; reason?: string }): Promise<void> {
  const { actor, view } = await requireGuestCase(params.token);
  await cancelContract({ contractId: view.contractId, actor, reason: params.reason ?? "guest-request" });
}

export type { CaseActor };
