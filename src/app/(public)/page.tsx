import type { Metadata } from "next";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { CategoriesSection } from "@/components/landing/categories";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { appConfig } from "@/lib/config";
import { loadCatalogue, type CatalogueGroup } from "@/lib/contracts/catalogue";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

const BRAND = appConfig.brand.name;

/**
 * Public metadata of the landing page (§33). Locale-aware: the Arabic page must
 * not advertise itself with the French title, so title, description and Open
 * Graph locale all come from the dictionary that is actually rendered. The
 * title communicates the category (contracts and legal documents in Morocco),
 * and neither title nor description mentions any technology.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getServerI18n();
  const { home } = d.public;
  const title = `${BRAND} — ${home.metaTitle}`;

  return {
    title: { absolute: title },
    description: home.metaDescription,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title,
      description: home.metaDescription,
      locale: locale === "ar" ? "ar_MA" : "fr_MA",
      url: "/",
    },
    twitter: {
      card: "summary",
      title,
      description: home.metaDescription,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Homepage — the Wathiqa front door.
 *
 * Five blocks in the order a first-time visitor needs them: the emerald stage
 * with its multi-page bail (hero), the category cards (the row of starting
 * points, plus the "J'ai déjà un document" verification card), the two
 * parcours (how it works), the three pricing tiers, the comparison with the
 * traditional office, and the FAQ. There is no simulator on the landing page:
 * the create journey lives on the catalogue, detail and wizard pages, the
 * verification journey on /verify. The footer lives in the route group
 * layout, so it also closes the catalogue and assistant pages.
 *
 * Every block is a server component fed from the dictionary: no marketing
 * claim is hard-coded in JSX, so the Arabic page states exactly the same thing
 * as the French one.
 */
export default async function HomePage() {
  const { locale, d } = await getServerI18n();
  const { home } = d.public;

  // Category cards only exist when the database has published documents for
  // them — an unreachable catalogue degrades to no row, never an error page.
  let groups: CatalogueGroup[] = [];
  try {
    groups = await loadCatalogue(appConfig.currency);
  } catch (error) {
    logger.warn("home.categories.unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <>
      <Hero
        badge={home.hero.badge}
        titleLine1={home.hero.titleLine1}
        titleAccent={home.hero.titleAccent}
        subtitle={home.hero.subtitle}
        chips={home.hero.chips}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        metrics={home.hero.metrics}
        document={home.hero.document}
      />

      <CategoriesSection
        copy={home.categories}
        locale={locale}
        groups={groups.map((group) => ({
          category: group.category,
          labelFr: group.labelFr,
          labelAr: group.labelAr,
          count: group.items.length,
        }))}
      />

      <HowItWorks
        eyebrow={home.howItWorks.eyebrow}
        title={home.howItWorks.title}
        subtitle={home.howItWorks.subtitle}
        createTrack={home.howItWorks.createTrack}
        verifyTrack={home.howItWorks.verifyTrack}
      />

      <PricingSection
        eyebrow={home.pricing.eyebrow}
        title={home.pricing.title}
        subtitle={home.pricing.subtitle}
        recommended={home.pricing.recommended}
        tiers={home.pricing.tiers}
      />

      <ComparisonSection
        eyebrow={home.comparison.eyebrow}
        title={home.comparison.title}
        columns={home.comparison.columns}
        rows={home.comparison.rows}
      />

      <Faq title={home.faqTitle} items={home.faq} />
    </>
  );
}
