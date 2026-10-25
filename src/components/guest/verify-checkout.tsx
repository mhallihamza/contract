"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Info, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * §8b — payment step of the verification confirmation page.
 *
 * The e-mail is asked first (report delivery, same rule as every checkout),
 * then the server builds the contract case and the provider checkout. The
 * sandbox settle button goes through the same signature-verified webhook path
 * as a real provider — the client cannot mark a payment as paid. After the
 * settle the page re-renders server-side and shows the honest CHECKING state.
 */

export interface VerifyCheckoutLabels {
  checkoutTitle: string;
  checkoutEmailTitle: string;
  checkoutEmailHint: string;
  checkoutEmailPlaceholder: string;
  checkoutPay: string;
  checkoutPaying: string;
  checkoutSettle: string;
  checkoutSettling: string;
  checkoutSimulatedNote: string;
  checkoutDoneTitle: string;
  checkoutDoneBody: string;
  checkoutErrorEmail: string;
  checkoutErrorGeneric: string;
}

type Step = "email" | "pay" | "settling" | "settled";

export function VerifyCheckout({
  token,
  labels,
  language,
  instructions,
  amountText,
  simulated,
}: {
  token: string;
  labels: VerifyCheckoutLabels;
  language: "fr" | "ar";
  /** Provider instructions already fetched (again), or null on the email step. */
  instructions: { fr: string; ar: string } | null;
  amountText: string;
  simulated: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>(instructions ? "pay" : "email");
  const [shownInstructions, setShownInstructions] = useState(instructions);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const label = language === "ar" ? (shownInstructions?.ar ?? "") : (shownInstructions?.fr ?? "");

  async function initiate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(labels.checkoutErrorEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/verify/${token}/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; data: { instructionsFr: string; instructionsAr: string; alreadyPaid: boolean } }
        | { ok: false; error: string }
        | null;
      if (response.ok && body?.ok) {
        if (body.data.alreadyPaid) {
          setStep("settled");
        } else {
          setShownInstructions({ fr: body.data.instructionsFr, ar: body.data.instructionsAr });
          setStep("pay");
        }
        return;
      }
      setError(body && !body.ok && body.error.includes("EMAIL") ? labels.checkoutErrorEmail : labels.checkoutErrorGeneric);
    } catch {
      setError(labels.checkoutErrorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function settle() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/verify/${token}/settle`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; data: { paid: boolean; status: string } }
        | { ok: false; error: string }
        | null;
      if (response.ok && body?.ok && body.data.paid) {
        setStep("settled");
        router.refresh();
        return;
      }
      setError(labels.checkoutErrorGeneric);
    } catch {
      setError(labels.checkoutErrorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (step === "settled") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg" dir="auto">
            <MailCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            {labels.checkoutDoneTitle}
          </CardTitle>
          <CardDescription dir="auto">{labels.checkoutDoneBody}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card id="verify-checkout">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg" dir="auto">
          <CreditCard className="h-5 w-5 text-primary" aria-hidden />
          {labels.checkoutTitle}
        </CardTitle>
        {amountText ? (
          <CardDescription className="text-sm font-semibold text-foreground" dir="auto">
            {amountText}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="verify-email" className="text-sm font-medium" dir="auto">
            {labels.checkoutEmailTitle}
          </label>
          <Input
            id="verify-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={labels.checkoutEmailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || step !== "email"}
            dir="ltr"
          />
          <p className="text-[11px] text-muted-foreground" dir="auto">
            {labels.checkoutEmailHint}
          </p>
        </div>

        {step !== "email" ? (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground" dir="auto">
            {label}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" dir="auto">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={step === "email" ? initiate : settle}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {step === "email"
            ? busy
              ? labels.checkoutPaying
              : labels.checkoutPay
            : busy
              ? labels.checkoutSettling
              : labels.checkoutSettle}
        </Button>

        {simulated ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground" dir="auto">
            <Info className="h-3.5 w-3.5" aria-hidden />
            {labels.checkoutSimulatedNote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
