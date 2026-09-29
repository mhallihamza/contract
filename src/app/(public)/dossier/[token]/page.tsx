import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutPanel, type CheckoutLabels } from "@/components/guest/checkout-panel";
import { GuestUnavailableCard } from "@/components/guest/unavailable-card";
import { requireGuestCase, type GuestCaseView } from "@/lib/guest/service";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = {
  title: "Votre dossier — suivi",
  description:
    "Suivez les étapes de votre dossier : questionnaire, paiement, préparation du document, validation juridique et signature.",
};

/** Statuses where the questionnaire is still open (router has not run yet). */
const PRE_ROUTING_STATUSES = new Set(["DRAFT", "INFORMATION_REQUIRED", "READY_FOR_ROUTING"]);

/**
 * Public order tracking (§18, §39).
 *
 * Everything shown here is a read-only projection of real backend state: the
 * timeline, the routing reason and the documents come from the case itself, and
 * the checkout only appears while the state machine says the case is payable.
 */
export default async function GuestDossierPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let view: GuestCaseView | null = null;
  try {
    const context = await requireGuestCase(token);
    view = context.view;
  } catch {
    view = null;
  }

  if (!view) return <GuestUnavailableCard />;

  const { locale, d } = await getServerI18n();
  const t = d.public.order;
  const co = d.public.checkout;

  const routeLabel = view.route ? d.statuses.contractRouteShort[view.route] : null;
  const contractTypeName = locale === "ar" ? view.contractType.nameAr : view.contractType.nameFr;

  const needsQuestionnaire = PRE_ROUTING_STATUSES.has(view.status);
  const awaitingHuman = view.status === "MANUAL_REVIEW_REQUIRED";
  const paid = view.payment?.status === "PAID";
  const payable =
    (view.status === "ROUTED" || view.status === "PAYMENT_REQUIRED") &&
    view.offers !== null &&
    !view.offers.blocked &&
    !paid;

  const checkoutLabels: CheckoutLabels = {
    servicesTitle: co.servicesTitle,
    requiredNotice: co.requiredNotice,
    blockedNotice: co.blockedNotice,
    included: co.included,
    includesSelf: d.public.product.selfServiceTitle,
    includesLawyer: d.public.product.lawyerTitle,
    includesSignature: d.public.catalogue.signatureBadge,
    chosen: co.chosen,
    emailTitle: co.emailTitle,
    emailHint: co.emailHint,
    emailLabel: co.emailLabel,
    emailCta: co.emailCta,
    summary: co.summary,
    total: co.total,
    payCta: co.payCta,
    paying: co.paying,
    simulated: co.simulated,
    paidNotice: co.paidNotice,
    errorGeneric: co.errorGeneric,
    missingEmail: co.missingEmail,
    expired: d.public.wizard.expired,
    offerLabels: {
      SELF_SERVICE: { title: d.public.product.selfServiceTitle, body: d.public.product.selfServiceBody },
      LAWYER_REVIEW: { title: d.public.product.lawyerTitle, body: d.public.product.lawyerBody },
      LAWYER_REQUIRED: { title: d.public.product.lawyerTitle, body: d.public.product.lawyerConditional },
    },
  };

  const selectedOfferKey = view.offers
    ? view.offers.offers.length === 1
      ? view.offers.offers[0]!.key
      : view.lawyerRequested
        ? ("LAWYER_REVIEW" as const)
        : ("SELF_SERVICE" as const)
    : ("SELF_SERVICE" as const);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            <span dir="auto">{contractTypeName}</span>
          </Badge>
          <Badge variant="secondary">
            {t.reference} : {view.reference}
          </Badge>
          <Badge variant={view.orderStatus === "COMPLETED" ? "success" : view.orderStatus === "CANCELLED" || view.orderStatus === "REFUNDED" ? "destructive" : "default"}>
            {t.statuses[view.orderStatus]}
          </Badge>
          {routeLabel ? <Badge variant="outline">{routeLabel}</Badge> : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground" dir="auto">
          {t.guestNotice}
        </p>
      </div>

      <div className="space-y-5">
        {needsQuestionnaire ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.resume}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/start/${token}`}>
                  {t.resume}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {awaitingHuman ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground" dir="auto">
                {co.blockedNotice}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {payable && view.offers ? (
          <CheckoutPanel
            token={token}
            locale={locale}
            offers={view.offers}
            selectedOfferKey={selectedOfferKey}
            customerEmail={view.customerEmail}
            labels={checkoutLabels}
          />
        ) : null}

        {paid ? (
          <p
            className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm"
            dir="auto"
          >
            {t.inProgress}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.timeline}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {view.timeline.map((step) => (
                <li
                  key={step.key}
                  className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className={step.state === "UPCOMING" ? "text-sm text-muted-foreground" : "text-sm font-medium"}>
                    {t.steps[step.key]}
                  </span>
                  <Badge
                    variant={
                      step.state === "DONE"
                        ? "success"
                        : step.state === "CURRENT"
                          ? "info"
                          : "outline"
                    }
                  >
                    {t.stepState[step.state]}
                  </Badge>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {view.decision && view.route ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.routeTitle}</CardTitle>
              <CardDescription dir="auto">{routeLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.routeReason}
                </p>
                <p className="text-sm" dir="auto">
                  {view.decision.reason}
                </p>
              </div>

              {view.decision.reasonCodes.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.routeCodes}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {view.decision.reasonCodes.map((code) => (
                      <Badge key={code} variant="outline" className="font-mono text-[11px]">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {view.decision.missingRuleContext.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.missingRuleContext}
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    {view.decision.missingRuleContext.map((gap) => (
                      <li key={gap} dir="auto">
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.documents}</CardTitle>
            {view.isFinal ? (
              <CardDescription dir="auto">{t.finalReady}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {view.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground" dir="auto">
                {t.noDocuments}
              </p>
            ) : (
              <ul className="space-y-2">
                {view.documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm" dir="auto">
                      {document.filename}
                    </span>
                    <a
                      href={`/api/documents/${document.id}?token=${encodeURIComponent(token)}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {t.download}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}