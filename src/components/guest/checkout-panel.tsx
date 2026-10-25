"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ServiceOfferKey, ServiceOfferSet } from "@/lib/contracts/service-offers";

/**
 * Guest checkout (§15, §16, §26).
 *
 * Three decisions, three server actions: which service the routing decision
 * allows (never the price, never the lawyer), where to deliver the document,
 * and payment. The panel only ever sends an offer key or an e-mail — amounts
 * are computed server-side and the settlement goes through the same signed
 * pipeline a provider webhook would use.
 */

export interface CheckoutOfferLabel {
  title: string;
  body: string;
}

export interface CheckoutLabels {
  servicesTitle: string;
  requiredNotice: string;
  blockedNotice: string;
  included: string;
  includesSelf: string;
  includesLawyer: string;
  includesSignature: string;
  chosen: string;
  emailTitle: string;
  emailHint: string;
  emailLabel: string;
  emailCta: string;
  summary: string;
  total: string;
  /** Link shown next to the preselected offer — jumps back to the choice list. */
  modifyChoice: string;
  payCta: string;
  paying: string;
  simulated: string;
  paidNotice: string;
  errorGeneric: string;
  missingEmail: string;
  expired: string;
  offerLabels: Partial<Record<ServiceOfferKey, CheckoutOfferLabel>>;
}

interface CheckoutPanelProps {
  token: string;
  locale: "fr" | "ar";
  offers: ServiceOfferSet;
  selectedOfferKey: ServiceOfferKey;
  customerEmail: string | null;
  labels: CheckoutLabels;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function CheckoutPanel({
  token,
  locale,
  offers,
  selectedOfferKey,
  customerEmail,
  labels,
}: CheckoutPanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ServiceOfferKey>(selectedOfferKey);
  const [email, setEmail] = useState(customerEmail ?? "");
  const [busy, setBusy] = useState<"service" | "email" | "pay" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const showChoice = offers.offers.length > 1;
  const currentOffer = offers.offers.find((offer) => offer.key === selected) ?? offers.offers[0] ?? null;

  async function post(action: string, body?: Record<string, unknown>): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`/api/guest/${token}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        const code = payload.error ?? "";
        setError(
          code === "EMAIL_REQUIRED_BEFORE_PAYMENT" || code === "VALIDATION_FAILED"
            ? labels.missingEmail
            : code === "GUEST_SESSION_NOT_FOUND"
              ? labels.expired
              : labels.errorGeneric,
        );
        return { ok: false };
      }
      return { ok: true };
    } catch {
      setError(labels.errorGeneric);
      return { ok: false };
    }
  }

  /** Records the service choice — only meaningful while the route allows it. */
  async function chooseService(key: ServiceOfferKey) {
    if (key === selected || busy !== null) return;
    setError(null);
    setBusy("service");
    const result = await post("service", { offerKey: key });
    setBusy(null);
    if (!result.ok) return;
    setSelected(key);
    router.refresh();
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      setError(labels.missingEmail);
      return;
    }
    setError(null);
    setBusy("email");
    const result = await post("email", { email: value });
    setBusy(null);
    if (!result.ok) return;
    setEmail(value);
    router.refresh();
  }

  /** Starts the payment, then settles it exactly like a provider callback. */
  async function pay() {
    if (busy !== null || paid) return;
    setError(null);
    setBusy("pay");
    const started = await post("checkout");
    if (started.ok) {
      const settled = await post("settle");
      if (settled.ok) {
        setPaid(true);
        router.refresh();
      }
    }
    setBusy(null);
  }

  if (offers.blocked) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground" dir="auto">
            {labels.blockedNotice}
          </p>
        </CardContent>
      </Card>
    );
  }

  const mandatoryNote =
    offers.reasonCode === "LAWYER_REQUIRED" || offers.reasonCode === "LAWYER_AND_SIGNATURE_REQUIRED"
      ? labels.requiredNotice
      : null;

  return (
    <div className="space-y-5">
      {showChoice ? (
        <Card id="service-choice">
          <CardHeader>
            <CardTitle className="text-lg">{labels.servicesTitle}</CardTitle>
            {mandatoryNote ? <CardDescription dir="auto">{mandatoryNote}</CardDescription> : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {offers.offers.map((offer) => {
              const offerLabel = labels.offerLabels[offer.key];
              const active = offer.key === selected;
              return (
                <button
                  key={offer.key}
                  type="button"
                  disabled={!offer.selectable || busy !== null}
                  onClick={() => chooseService(offer.key)}
                  className={`flex w-full items-start justify-between gap-4 rounded-md border p-4 text-start transition-colors ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  } ${offer.selectable ? "" : "cursor-not-allowed opacity-60"}`}
                >
                  <span className="space-y-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span dir="auto">{offerLabel?.title ?? offer.key}</span>
                      {active ? <Badge variant="secondary">{labels.chosen}</Badge> : null}
                    </span>
                    <span className="block text-xs text-muted-foreground" dir="auto">
                      {offerLabel?.body}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-sm font-semibold">
                    {offer.quote.vat ? offer.quote.vat.total : offer.quote.amount} {offer.quote.currency}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-4 w-4" aria-hidden />
            {labels.emailTitle}
          </CardTitle>
          <CardDescription dir="auto">{labels.emailHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5 text-sm">
              <span>{labels.emailLabel}</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nom@exemple.com"
                dir="ltr"
                autoComplete="email"
                required
              />
            </label>
            <Button type="submit" disabled={busy === "email"}>
              {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {labels.emailCta}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{labels.summary}</CardTitle>
          {!showChoice && mandatoryNote ? (
            <CardDescription dir="auto">{mandatoryNote}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentOffer ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {labels.included}
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {labels.includesSelf}
                  </li>
                  {currentOffer.includesLawyer ? (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {labels.includesLawyer}
                    </li>
                  ) : null}
                  {currentOffer.includesSignature ? (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {labels.includesSignature}
                    </li>
                  ) : null}
                </ul>
              </div>

              <ul className="space-y-1.5 text-sm">
                {currentOffer.quote.lines.map((line) => (
                  <li key={line.key} className="flex justify-between gap-3">
                    <span className="text-muted-foreground" dir="auto">
                      {locale === "ar" ? line.labelAr : line.labelFr}
                    </span>
                    <span>
                      {line.amount} {currentOffer.quote.currency}
                    </span>
                  </li>
                ))}
                {currentOffer.quote.vat ? (
                  <li className="flex justify-between gap-3 text-xs">
                    <span className="text-muted-foreground" dir="auto">
                      {locale === "ar" ? currentOffer.quote.vat.labelAr : currentOffer.quote.vat.labelFr}
                    </span>
                    <span>
                      {currentOffer.quote.vat.vatAmount} {currentOffer.quote.currency}
                    </span>
                  </li>
                ) : null}
              </ul>
            </>
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>{labels.total}</span>
            <span>
              {currentOffer
                ? `${currentOffer.quote.vat ? currentOffer.quote.vat.total : currentOffer.quote.amount} ${currentOffer.quote.currency}`
                : "—"}
            </span>
          </div>

          {showChoice ? (
            <a
              href="#service-choice"
              className="text-xs font-medium text-primary underline underline-offset-4"
              dir="auto"
            >
              {labels.modifyChoice}
            </a>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" dir="auto">
              {error}
            </p>
          ) : null}

          <Button className="w-full" onClick={pay} disabled={busy === "pay" || paid}>
            {busy === "pay" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            {busy === "pay" ? labels.paying : labels.payCta}
          </Button>

          {paid ? (
            <p
              className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              dir="auto"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {labels.paidNotice}
            </p>
          ) : null}

          <p className="flex items-start gap-2 text-xs text-muted-foreground" dir="auto">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {labels.simulated}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}