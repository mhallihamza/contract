import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CatalogueFilter } from "@/components/marketing/catalogue-filter";
import { loadCatalogue, isContractCategory } from "@/lib/contracts/catalogue";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

/**
 * Catalogue metadata (§33). Locale-aware, exactly like the landing and legal
 * pages: the Arabic catalogue must not advertise itself with the French title,
 * so title and description come from the dictionary that is actually rendered.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getServerI18n();
  const t = d.public.catalogue;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: "/contracts" },
  };
}

/**
 * Catalogue (§1, §6, §17).
 *
 * The complete list of purchasable documents — every card comes from the
 * database and the "Commencer" CTA is a plain form post that creates the
 * anonymous case server-side (§8), so the journey also works without
 * JavaScript. Search is a *secondary* filter over these same rows (§18), never
 * the way documents are discovered.
 */
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; category?: string; tier?: string }>;
}) {
  const [{ locale, d }, params] = await Promise.all([getServerI18n(), searchParams]);
  const t = d.public.catalogue;
  // Deep link from a marketing entry point (§11 solutions, §18 footer): the chip
  // starts on that family. Unknown values are ignored, never applied.
  const initialCategory = isContractCategory(params.category) ? params.category : undefined;
  // Tier memory from a pricing card: only carried through to the start form —
  // the allowlist inside the guest start service decides what is honored.
  const tier = params.tier?.trim() || undefined;

  let groups: Awaited<ReturnType<typeof loadCatalogue>> = [];
  try {
    groups = await loadCatalogue(appConfig.currency);
  } catch (error) {
    logger.warn("catalogue.unavailable", { error: error instanceof Error ? error.message : String(error) });
  }

  const cardLabels = {
    from: t.from,
    estimatedTime: t.estimatedTime,
    questions: t.questions,
    lawyerBadge: t.lawyerBadge,
    documentsAtHand: t.documentsAtHand,
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.pageTitle}</h1>
        <p className="text-sm text-muted-foreground sm:text-base" dir="auto">
          {t.pageSubtitle}
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
        <CatalogueFilter
          locale={locale}
          groups={groups}
          labels={cardLabels}
          initialCategory={initialCategory}
          tier={tier}
          strings={{
            searchLabel: t.searchLabel,
            searchPlaceholder: t.searchPlaceholder,
            allCategories: t.allCategories,
            noResult: t.noResult,
            start: t.start,
            details: t.details,
          }}
        />
      )}

      <p className="mt-14 text-xs text-muted-foreground" dir="auto">
        {t.legalNote}
      </p>
    </div>
  );
}
