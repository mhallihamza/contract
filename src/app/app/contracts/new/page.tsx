import { NewRequestForm } from "@/components/app/new-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { loadActiveContractTypes } from "@/lib/contracts/service";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = { title: "Nouvelle demande" };

/**
 * Intake entry point (§30).
 *
 * The landing page and the public hero forward their text through `?q=`, so a
 * visitor never retypes what they already wrote.
 */
export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const [{ locale, d }, params] = await Promise.all([getServerI18n(), searchParams]);

  let types: { code: string; name: string }[] = [];
  try {
    const loaded = await loadActiveContractTypes();
    types = loaded.map((type) => ({ code: type.code, name: locale === "ar" ? type.nameAr : type.nameFr }));
  } catch {
    types = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{d.client.newRequestTitle}</h1>
        <p className="text-sm text-muted-foreground">{d.client.newRequestSubtitle}</p>
      </header>

      <NewRequestForm
        initialText={params.q ?? ""}
        suggestions={d.landing.examples}
        types={types}
        labels={{
          title: d.client.newRequestTitle,
          subtitle: d.client.newRequestSubtitle,
          placeholder: d.client.newRequestPlaceholder,
          cta: d.client.newRequestCta,
          analyzing: d.client.newRequestAnalyzing,
          suggestionsTitle: d.client.suggestionsTitle,
          typeLabel: d.client.chooseTypeTitle,
          noneOption: d.client.chooseTypeSubtitle,
          errorUnexpected: d.common.unexpectedError,
        }}
      />

      <Card className="border-dashed bg-muted/20">
        <CardContent className="space-y-2 p-5 text-xs text-muted-foreground">
          <p dir="auto">{d.common.disclaimers.aiAssisted}</p>
          <p dir="auto">{d.common.disclaimers.routingBasedOnRules}</p>
          <p dir="auto">{d.common.disclaimers.notLegalAdvice}</p>
        </CardContent>
      </Card>
    </div>
  );
}
