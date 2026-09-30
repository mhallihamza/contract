import type { Metadata } from "next";
import { AssistantPreview } from "@/components/landing/assistant-preview";
import { BusinessSection } from "@/components/landing/business-section";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { HomeHero } from "@/components/landing/home-hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProfessionalValidation } from "@/components/landing/professional-validation";
import { SecuritySection } from "@/components/landing/security-section";
import { UseCases } from "@/components/landing/use-cases";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";
import { HERO_PHOTO } from "@/lib/marketing/mock-data";

const BRAND = appConfig.brand.name;

/**
 * Public metadata of the landing page (§27). Locale-aware: the Arabic page must
 * not advertise itself with the French headline in a search result or a share
 * card, so title, description and Open Graph locale all come from the dictionary
 * that is actually rendered. Absolute title: the marketing brand is what a
 * search result has to show, not the internal product name.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getServerI18n();
  const { home } = d.public;
  const title = `${BRAND} — ${home.heroTitle}`;

  return {
    title: { absolute: title },
    description: home.heroSubtitle,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title,
      description: home.heroSubtitle,
      locale: locale === "ar" ? "ar_MA" : "fr_MA",
      url: "/",
      images: [{ url: HERO_PHOTO, alt: "" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: home.heroSubtitle,
      images: [HERO_PHOTO],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Homepage (§7–§18).
 *
 * Eight content blocks in the order a visitor needs them: the promise and its
 * two doors (hero), the situations we actually cover (solutions), the sequence
 * of a case (how it works), the one sentence → structured request transformation
 * (assistant preview), where a human takes over (validation), what we do with
 * the documents (security), the company view (dashboard preview), the objections
 * (FAQ) and a closing call to action.
 *
 * Every block is a server component fed from the dictionary: no marketing claim
 * is hard-coded in JSX, so the Arabic page states exactly the same thing as the
 * French one.
 */
export default async function HomePage() {
  const { d } = await getServerI18n();
  const { home } = d.public;

  return (
    <>
      <HomeHero
        eyebrow={home.eyebrow}
        title={home.heroTitle}
        subtitle={home.heroSubtitle}
        primaryCta={home.heroCta}
        secondaryCta={home.heroCtaSecondary}
        reassurance={home.reassurance}
        trustItems={home.trust}
      />

      <UseCases
        title={home.solutionsTitle}
        subtitle={home.solutionsSubtitle}
        note={home.solutionsNote}
        cta={home.solutionsCta}
        labels={home.useCases}
      />

      <HowItWorks title={home.stepsTitle} subtitle={home.stepsSubtitle} steps={home.steps} />

      <AssistantPreview
        title={home.assistantTitle}
        subtitle={home.assistantSubtitle}
        cta={home.assistantCta}
        assistant={home.assistant}
      />

      <ProfessionalValidation
        title={home.validationTitle}
        subtitle={home.validationSubtitle}
        stages={home.validationStages}
      />

      <SecuritySection
        title={home.securityTitle}
        subtitle={home.securitySubtitle}
        items={home.securityItems}
      />

      <BusinessSection
        title={home.businessTitle}
        subtitle={home.businessSubtitle}
        cta={home.businessCta}
        business={home.business}
      />

      <Faq title={d.landing.faqTitle} items={d.landing.faq} />

      <FinalCta
        title={home.finalCtaTitle}
        subtitle={home.finalCtaSubtitle}
        primaryCta={home.finalCtaPrimary}
        secondaryCta={home.finalCtaSecondary}
      />
    </>
  );
}
