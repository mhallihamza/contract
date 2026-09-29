import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, FileText, HelpCircle, ListChecks, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCatalogue, type CatalogueItem } from "@/lib/contracts/catalogue";
import { appConfig } from "@/lib/config";
import { interpolate } from "@/lib/i18n/dictionaries";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

export const metadata = {
  title: "Documents juridiques — catalogue",
  description:
    "Choisissez un document juridique, complétez un questionnaire guidé et obtenez un document adapté à votre situation.",
};

/**
 * Catalogue (§1, §6).
 *
 * The primary entry point of the product — not a chatbot. Every card comes from the
 * database and the CTA is a plain form post that creates the anonymous case
 * server-side (§8), so the journey also works without JavaScript.
 */
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale, d }, params] = await Promise.all([getServerI18n(), searchParams]);
  const t = d.public.catalogue;

  let groups: Awaited<ReturnType<typeof loadCatalogue>> = [];
  try {
    groups = await loadCatalogue(appConfig.currency);
  } catch (error) {
    logger.warn("catalogue.unavailable", { error: error instanceof Error ? error.message : String(error) });
  }

  const name = (item: CatalogueItem) => (locale === "ar" ? item.nameAr : item.nameFr);
  const description = (item: CatalogueItem) => (locale === "ar" ? item.descriptionAr : item.descriptionFr);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground sm:text-base" dir="auto">
          {t.subtitle}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.noAccount}
          </Badge>
          <Button asChild variant="link" className="h-auto px-0">
            <Link href="/assistant">
              <HelpCircle className="h-4 w-4" aria-hidden />
              {t.needHelpCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </div>

        {params.error === "unavailable" ? (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            dir="auto"
          >
            {t.unavailable}
          </p>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground" dir="auto">
          {t.empty}
        </p>
      ) : (
        <CatalogueGrid groups={groups} locale={locale} labels={t} name={name} description={description} />
      )}

      <p className="mt-14 text-xs text-muted-foreground" dir="auto">
        {t.legalNote}
      </p>
    </div>
  );
}

/** Category sections + document cards (extracted so the page stays readable). */
function CatalogueGrid({
  groups,
  locale,
  labels,
  name,
  description,
}: {
  groups: { category: string; labelFr: string; labelAr: string; items: CatalogueItem[] }[];
  locale: "fr" | "ar";
  labels: {
    start: string;
    from: string;
    questions: string;
    estimatedTime: string;
    lawyerBadge: string;
  };
  name: (item: CatalogueItem) => string;
  description: (item: CatalogueItem) => string;
}) {
  return (
    <div className="mt-12 space-y-14">
      {groups.map((group) => (
        <section key={group.category} className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{locale === "ar" ? group.labelAr : group.labelFr}</h2>
            <span className="text-xs text-muted-foreground">
              {group.items.length} {locale === "ar" ? "وثائق" : "documents"}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <Card key={item.code} className="flex flex-col">
                <CardHeader className="space-y-2">
                  {item.lawyerReviewAvailable ? (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      {labels.lawyerBadge}
                    </Badge>
                  ) : null}
                  <CardTitle className="text-base leading-snug">
                    <Link href={`/contracts/${item.slug}`} className="hover:text-primary">
                      {name(item)}
                    </Link>
                  </CardTitle>
                  <CardDescription dir="auto">{description(item)}</CardDescription>
                </CardHeader>

                <CardContent className="mt-auto space-y-4">
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {interpolate(labels.estimatedTime, { minutes: item.completionMinutes })}
                    </li>
                    <li className="flex items-center gap-2">
                      <ListChecks className="h-3.5 w-3.5" aria-hidden />
                      {interpolate(labels.questions, { count: item.questionCount })}
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      {labels.from} {item.startingPrice} {item.currency}
                    </li>
                  </ul>

                  <div className="flex items-center gap-2">
                    <form action="/api/guest/start" method="post">
                      <input type="hidden" name="slug" value={item.slug} />
                      <Button type="submit" size="sm">
                        {labels.start}
                      </Button>
                    </form>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/contracts/${item.slug}`}>{locale === "ar" ? "التفاصيل" : "Détails"}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
