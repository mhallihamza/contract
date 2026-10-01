import type { Metadata } from "next";
import { BusinessSection } from "@/components/landing/business-section";
import { ConfidentialitySection } from "@/components/landing/confidentiality-section";
import { ContractLifecycle } from "@/components/landing/contract-lifecycle";
import { ContractReviewSection } from "@/components/landing/contract-review-section";
import { DocumentManagementSection } from "@/components/landing/document-management-section";
import { EntrepreneurSection } from "@/components/landing/entrepreneur-section";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { NeedSection } from "@/components/landing/need-section";
import { ProfessionalValidation } from "@/components/landing/professional-validation";
import { ServicesSection } from "@/components/landing/services-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { WhySection } from "@/components/landing/why-section";
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
 * Homepage (§7–§23).
 *
 * Fourteen blocks in the order a first-time visitor needs them: the promise
 * with its contract-workspace composition (hero), the trust strip, the
 * need-to-request transformation, the services index, the contract review,
 * the lifecycle, the professional validation, the document management
 * surface, the entrepreneur situations, the company dashboard, the
 * principles, confidentiality, the FAQ and the closing call to action.
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
        workspace={home.workspace}
      />

      <TrustBar items={home.trustStrip} />

      <NeedSection title={home.needTitle} subtitle={home.needSubtitle} need={home.need} />

      <ServicesSection
        eyebrow={home.servicesEyebrow}
        title={home.servicesTitle}
        subtitle={home.servicesSubtitle}
        services={home.services}
      />

      <ContractReviewSection
        title={home.reviewTitle}
        statement={home.reviewStatement}
        text={home.reviewText}
        review={home.review}
      />

      <ContractLifecycle
        title={home.lifecycleTitle}
        subtitle={home.lifecycleSubtitle}
        steps={home.lifecycle}
      />

      <ProfessionalValidation
        title={home.validationTitle}
        text={home.validationText}
        points={home.validationPoints}
        dossier={home.dossier}
      />

      <DocumentManagementSection
        title={home.documentsTitle}
        text={home.documentsText}
        documents={home.documents}
      />

      <EntrepreneurSection
        title={home.entrepreneurTitle}
        text={home.entrepreneurText}
        cases={home.entrepreneurCases}
      />

      <BusinessSection title={home.businessTitle} subtitle={home.businessSubtitle} business={home.business} />

      <WhySection title={home.whyTitle} principles={home.why} />

      <ConfidentialitySection
        title={home.confidentialityTitle}
        text={home.confidentialityText}
        points={home.confidentialityPoints}
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
