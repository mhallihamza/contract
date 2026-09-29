import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCatalogueItem, loadDocumentOutline, type CatalogueItem } from "@/lib/contracts/catalogue";
import { appConfig } from "@/lib/config";
import { interpolate } from "@/lib/i18n/dictionaries";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

/**
 * Contract product page (§7).
 *
 * Server-rendered from the database: badges, price and document outline all come
 * from the configured rules, the pricing engine and the approved template. The CTA
 * is a form post that starts the anonymous case — no signup wall between the
 * visitor and the questionnaire.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadCatalogueItem(slug, appConfig.currency).catch(() => null);
  if (!item) return { title: "Document indisponible" };
  return { title: `${item.nameFr} — ${appConfig.name}`, description: item.descriptionFr };
}

export default async function ContractProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale, d }] = await Promise.all([params, getServerI18n()]);
  const t = d.public.product;

  let item: CatalogueItem | null = null;
  try {
    item = await loadCatalogueItem(slug, appConfig.currency);
  } catch (error) {
    logger.warn("product.unavailable", { slug, error: error instanceof Error ? error.message : String(error) });
  }
  if (!item) notFound();

  const outline = await loadDocumentOutline(item.code);
  const name = locale === "ar" ? item.nameAr : item.nameFr;
  const description = locale === "ar" ? item.descriptionAr : item.descriptionFr;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.home}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        <Link href="/contracts" className="hover:text-foreground">
          {t.contracts}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        <span className="truncate text-foreground">{name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="outline">{locale === "ar" ? item.categoryLabelAr : item.categoryLabelFr}</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <p className="text-sm text-muted-foreground sm:text-base" dir="auto">
              {t.title}
            </p>
            <p className="text-sm text-muted-foreground" dir="auto">
              {description}
            </p>

            <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden />
                {t.time} : {interpolate(d.public.catalogue.estimatedTime, { minutes: item.completionMinutes })}
              </li>
              <li className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" aria-hidden />
                {interpolate(d.public.catalogue.questions, { count: item.questionCount })}
              </li>
              {item.lawyerReviewAvailable ? (
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" aria-hidden />
                  {d.public.catalogue.lawyerBadge}
                </li>
              ) : null}
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.howTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {t.howSteps.map((step, index) => (
                  <li key={step} className="flex gap-3" dir="auto">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">{t.documentsTitle}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {item.requiredDocuments.length === 0 ? (
                <li dir="auto">{t.documentsEmpty}</li>
              ) : (
                item.requiredDocuments.map((document) => (
                  <li key={document} className="flex items-start gap-2" dir="auto">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{document}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">{d.public.catalogue.start}</CardTitle>
              <p className="text-xs text-muted-foreground" dir="auto">
                {t.whatYouNeedBody}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t.price}</p>
                <p className="text-2xl font-semibold">
                  {item.startingPrice} {item.currency}
                </p>
                {outline.sectionCount > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {interpolate(d.public.checkout.sections, { count: outline.sectionCount })}
                  </p>
                ) : null}
              </div>

              <form action="/api/guest/start" method="post">
                <input type="hidden" name="slug" value={item.slug} />
                <Button type="submit" size="lg" className="w-full">
                  {t.start}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </Button>
              </form>

              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {d.public.catalogue.noAccount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.servicesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" aria-hidden />
                  {t.selfServiceTitle}
                </p>
                <p className="text-xs text-muted-foreground" dir="auto">
                  {t.selfServiceBody}
                </p>
              </div>

              {item.lawyerReviewAvailable ? (
                <div className="space-y-1 border-t border-border/60 pt-3">
                  <p className="flex items-center gap-2 font-medium">
                    <PenLine className="h-4 w-4" aria-hidden />
                    {t.lawyerTitle}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="auto">
                    {t.lawyerBody}
                  </p>
                </div>
              ) : null}

              <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground" dir="auto">
                {t.lawyerConditional}
              </p>
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 text-xs text-muted-foreground" dir="auto">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t.disclaimer}
          </p>
        </aside>
      </div>

      <section className="mt-14 space-y-5">
        <h2 className="text-lg font-semibold tracking-tight">{t.faqTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {t.faq.map((entry) => (
            <Card key={entry.q}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" dir="auto">
                  {entry.q}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground" dir="auto">
                  {entry.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}