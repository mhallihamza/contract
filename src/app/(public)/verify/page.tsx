import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyIntakeForm, type VerifyIntakeConfig } from "@/components/guest/verify-intake";
import { getServerI18n } from "@/lib/i18n/server";
import { verifyMaxBytes, verifyRetentionDays, VERIFICATION_MIME_LABELS } from "@/lib/verification/rules";
import { verifyTierFromQuery } from "@/lib/verify/tiers";

/**
 * Verification journey (§8b) — "faire vérifier un document existant".
 *
 * No form, no questionnaire: the visitor picks a file and a tier and that is
 * the whole screen. The left column carries the sample-free upload + tier
 * choice; the right column is an empty, clearly labelled placeholder until a
 * file is chosen — a sample contract is never displayed here. Safety copy
 * (accepted types, maximum size, private storage and retention) is shown
 * before the upload, and every rule is enforced again server-side.
 */

const EXTENSIONS_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/jpeg": ".jpg,.jpeg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getServerI18n();
  const t = d.public.verify;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: "/verify" },
  };
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const [{ locale, d }, query] = await Promise.all([getServerI18n(), searchParams]);
  const t = d.public.verify;

  const maxBytes = verifyMaxBytes();

  const maxSizeText =
    locale === "ar"
      ? `${Math.ceil(maxBytes / (1024 * 1024))} م.ب`
      : `${Number.isInteger(maxBytes / (1024 * 1024)) ? maxBytes / (1024 * 1024) : (maxBytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;

  const config: VerifyIntakeConfig = {
    maxBytes,
    maxSizeText,
    accept: Object.entries(EXTENSIONS_BY_MIME)
      .filter(([mime]) => mime in VERIFICATION_MIME_LABELS)
      .map(([, extensions]) => extensions)
      .join(","),
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 space-y-3 text-center">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
          {t.eyebrow}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" dir="auto">
          {t.title}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground" dir="auto">
          {t.subtitle}
        </p>
      </div>

      <VerifyIntakeForm
        labels={t}
        config={config}
        retentionNote={t.retentionNote.replace("{days}", String(verifyRetentionDays()))}
        delayHint={{ ASSISTED: t.delayAssisted, LAWYER: t.delayLawyer }}
        priceUnit={locale === "ar" ? "دون ضريبة" : "HT"}
        initialTier={verifyTierFromQuery(query.tier)}
      />

      {/* What the verification produces — plain words, no legal-advice claims. */}
      <section className="mt-14" aria-labelledby="verify-produces">
        <h2 id="verify-produces" className="text-lg font-semibold" dir="auto">
          {t.producesTitle}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base" dir="auto">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                {t.tierAssistedTitle}
              </CardTitle>
              <CardDescription dir="auto">{t.delayAssisted}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground" dir="auto">
              {t.producesAssisted}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base" dir="auto">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                {t.tierLawyerTitle}
              </CardTitle>
              <CardDescription dir="auto">{t.delayLawyer}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground" dir="auto">
              {t.producesLawyer}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
