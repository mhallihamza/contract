import type { Metadata } from "next";
import { BusinessSection } from "@/components/landing/business-section";
import { ContractReviewSection } from "@/components/landing/contract-review-section";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { NeedsSection } from "@/components/landing/needs-section";
import { ProfessionalValidation } from "@/components/landing/professional-validation";
import { ServicesSection } from "@/components/landing/services-section";
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
 * Homepage (§5–§17).
 *
 * Nine blocks, in the order a first-time visitor needs them: the promise with
 * its single contract document (hero), the two situations a visitor starts
 * from, the services index, the contract review, the professional validation
 * (the one dark band of the page), the compact business preview, the
 * three-step explanation, the FAQ and the closing call to action. That is the
 * whole page — no trust strip, no lifecycle diagram, no document dashboard, no
 * second product mockup.
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
        eyebrow={home.eyebrow}
        title={home.heroTitle}
        subtitle={home.heroSubtitle}
        primaryCta={home.heroCta}
        secondaryCta={home.heroCtaSecondary}
        reassurance={home.heroReassurance}
        document={home.heroDocument}
      />

      <NeedsSection
        eyebrow={home.needsEyebrow}
        title={home.needsTitle}
        subtitle={home.needsSubtitle}
        needs={home.needs}
      />

      <ServicesSection
        eyebrow={home.servicesEyebrow}
        title={home.servicesTitle}
        services={home.services}
      />

      <ContractReviewSection title={home.reviewTitle} text={home.reviewText} review={home.review} />

      <ProfessionalValidation
        title={home.validationTitle}
        text={home.validationText}
        card={home.validationCard}
      />

      <BusinessSection
        title={home.businessTitle}
        text={home.businessText}
        business={home.business}
      />

      <HowItWorks title={home.stepsTitle} steps={home.steps} />

      <Faq title={d.landing.faqTitle} items={d.landing.faq} />

      <FinalCta
        title={home.finalCtaTitle}
        subtitle={home.finalCtaSubtitle}
        primaryCta={home.finalCtaPrimary}
      />
    </>
  );
}
