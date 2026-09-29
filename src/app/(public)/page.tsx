import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/landing/faq";
import { ProcessSteps } from "@/components/landing/process-steps";
import { CatalogueTabs } from "@/components/marketing/catalogue-tabs";
import { appConfig } from "@/lib/config";
import { loadCatalogue } from "@/lib/contracts/catalogue";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

export const metadata = {
  title: "Vos documents juridiques, simplement — Maroc",
  description:
    "Choisissez un document juridique, répondez à quelques questions et obtenez un document adapté à votre situation. Sans création de compte.",
};

/**
 * Public homepage (§2–§7).
 *
 * Catalogue-first by design: the visitor immediately sees real `ContractType`
 * records grouped by category — no search box, no chatbot and no login wall.
 * The AI assistant stays a secondary router, one click below the catalogue.
 */
async function loadHomeGroups() {
  try {
    return await loadCatalogue(appConfig.currency);
  } catch (error) {
    logger.warn("home.catalogue_unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default async function HomePage() {
  const [{ locale, d }, groups] = await Promise.all([getServerI18n(), loadHomeGroups()]);
  const home = d.public.home;
  const t = d.public.catalogue;

  const cardLabels = {
    from: t.from,
    estimatedTime: t.estimatedTime,
    lawyerBadge: t.lawyerBadge,
  } as const;

  return (
    <div className="flex flex-col">
      {/* Hero — restrained, no search input, catalogue as the dominant experience. */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.05] to-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {home.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg" dir="auto">
            {home.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="#documents">
                {home.heroCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/assistant">{home.heroCtaSecondary}</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">{t.noAccount}</p>
        </div>
      </section>

      {/* Catalogue — real database records, grouped by category. */}
      <section id="documents" className="py-16 lg:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <header className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{home.catalogueTitle}</h2>
            <p className="text-sm text-muted-foreground" dir="auto">
              {home.catalogueSubtitle}
            </p>
          </header>

          <div className="mt-8">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground" dir="auto">
                {t.empty}
              </p>
            ) : (
              <CatalogueTabs
                locale={locale}
                groups={groups.map((group) => ({
                  category: group.category,
                  labelFr: group.labelFr,
                  labelAr: group.labelAr,
                  items: group.items,
                }))}
                labels={cardLabels}
                startLabel={t.start}
              />
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="link" size="lg">
              <Link href="/contracts">
                {home.seeAll}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI assistant — secondary router, never the main experience. */}
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{home.aiTitle}</h2>
          <p className="max-w-xl text-sm text-muted-foreground" dir="auto">
            {home.aiBody}
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/assistant">
              {home.aiCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <ProcessSteps title={home.processTitle} subtitle={home.processSubtitle} steps={home.processSteps} />

      <Faq title={d.landing.faqTitle} items={d.landing.faq} />
    </div>
  );
}