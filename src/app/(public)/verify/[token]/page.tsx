import type { Metadata } from "next";
import Link from "next/link";
import { Check, FileText, ReceiptText, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerifyCheckout } from "@/components/guest/verify-checkout";
import { getServerI18n } from "@/lib/i18n/server";
import { verifyRetentionDays } from "@/lib/verification/rules";
import { resolveVerificationCase } from "@/lib/verification/service";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * Verification confirmation (§8b).
 *
 * Reached with the one-time bearer token the upload response issued, this page
 * shows exactly what was received — file name, size, chosen tier, expected
 * delay and the amount due — plus the retention promise, then the checkout
 * (e-mail first) once the intake is confirmed. It never claims the report is
 * delivered already: the intake is RECEIVED until the payment opens the
 * VERIFICATION_IN_PROGRESS branch of the state machine.
 */

export const metadata: Metadata = {
  title: "Vérification reçue — dossier",
  robots: { index: false },
};

export default async function VerifyConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [{ locale, d }, intake] = await Promise.all([getServerI18n(), resolveVerificationCase(token)]);
  const t = d.public.verify;

  if (!intake) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold" dir="auto">
          {t.notFoundTitle}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground" dir="auto">
          {t.notFoundBody}
        </p>
        <Button asChild className="mt-6">
          <Link href="/verify">
            <span dir="auto">{t.verifyAnother}</span>
          </Link>
        </Button>
      </div>
    );
  }

  const isLawyer = intake.summary.tier === "LAWYER";
  const tierTitle = isLawyer ? t.tierLawyerTitle : t.tierAssistedTitle;
  const price = isLawyer ? t.tierLawyerPrice : t.tierAssistedPrice;
  const delay = isLawyer ? t.delayLawyer : t.delayAssisted;
  const sizeText = locale === "ar"
    ? `${(intake.summary.sizeBytes / (1024 * 1024)).toFixed(2).replace(".", ",")} م.ب`
    : `${(intake.summary.sizeBytes / (1024 * 1024)).toFixed(2).replace(".", ",")} Mo`;
  const checking = intake.paid && intake.summary.status !== "RECEIVED";
  const providerSimulated = getPaymentProvider().simulated;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Check className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" dir="auto">
          {t.confirmationTitle}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground" dir="auto">
          {t.confirmationSubtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg" dir="auto">
            <ReceiptText className="h-5 w-5 text-primary" aria-hidden />
            {t.referenceLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center font-mono text-lg font-bold tracking-wide">
            {intake.summary.reference}
          </p>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground" dir="auto">
                {t.fileLabel}
              </dt>
              <dd className="flex min-w-0 items-center gap-2 text-right" dir="auto">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="break-all">{intake.summary.filename}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground" dir="auto">
                {t.sizeLabel}
              </dt>
              <dd dir="auto">{sizeText}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground" dir="auto">
                {t.tierLabel}
              </dt>
              <dd dir="auto">{tierTitle}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground" dir="auto">
                {t.delayLabel}
              </dt>
              <dd dir="auto">{delay}</dd>
            </div>
            {intake.caseReference ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground" dir="auto">
                  {t.caseLabel}
                </dt>
                <dd className="font-mono text-xs">{intake.caseReference}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground" dir="auto">
                {t.statusLabel}
              </dt>
              <dd
                className={`flex items-center gap-1.5 font-medium ${
                  checking
                    ? "text-primary"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
                dir="auto"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                {checking ? t.statusChecking : t.statusReceived}
              </dd>
            </div>
          </dl>

          {checking && intake.caseReference ? (
            <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground" dir="auto">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t.checkoutDoneBody}
            </p>
          ) : null}

          {/* §8b — the checkout sits on this page: e-mail first, then the
              sandbox settlement through the shared, signed webhook path. */}
          {!checking && intake.summary.status === "RECEIVED" ? (
            <VerifyCheckout
              token={token}
              language={locale}
              labels={t}
              instructions={
                intake.hasPendingPayment
                  ? {
                      fr: "Un paiement est déjà en attente pour ce dossier.",
                      ar: "يوجد أداء قيد الانتظار لهذا الملف.",
                    }
                  : null
              }
              amountText={`${price} ${locale === "ar" ? "(دون ضريبة + الضريبة عند الأداء)" : "(HT + TVA au règlement)"}`}
              simulated={providerSimulated}
            />
          ) : null}

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground" dir="auto">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {t.retentionNote.replace("{days}", String(verifyRetentionDays()))}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href="/verify">
            <span dir="auto">{t.verifyAnother}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
