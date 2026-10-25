import type { Metadata } from "next";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { Simulator } from "@/components/landing/simulator";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";

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
 * Six blocks in the order a first-time visitor needs them: the emerald stage
 * with its typed bail (hero), the two starting points (how it works), the live
 * simulator where the document actually gets drafted or verified, the three
 * pricing tiers, the comparison with the traditional office, and the FAQ. The
 * footer lives in the route group layout, so it also closes the catalogue and
 * assistant pages.
 *
 * Every block is a server component fed from the dictionary: no marketing
 * claim is hard-coded in JSX, so the Arabic page states exactly the same thing
 * as the French one.
 */
export default async function HomePage() {
  const { d } = await getServerI18n();
  const { home } = d.public;

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

      <HowItWorks
        eyebrow={home.howItWorks.eyebrow}
        title={home.howItWorks.title}
        subtitle={home.howItWorks.subtitle}
        createTrack={home.howItWorks.createTrack}
        verifyTrack={home.howItWorks.verifyTrack}
      />

      <Simulator copy={home.simulator} />

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
