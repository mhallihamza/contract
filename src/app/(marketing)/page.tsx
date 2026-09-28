import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentTypes, type SupportedContractType } from "@/components/landing/document-types";
import { Faq } from "@/components/landing/faq";
import { Guarantees } from "@/components/landing/guarantees";
import { HeroIntake } from "@/components/landing/hero-intake";
import { ProcessSteps } from "@/components/landing/process-steps";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import { db, isDatabaseConfigured } from "@/lib/db/prisma";
import { getServerI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logging";

export const metadata = {
  title: "Plateforme Juridique Maroc — du besoin au contrat",
  description:
    "Décrivez votre besoin en français, en arabe ou en darija : la plateforme structure votre demande, prépare le contrat et fait intervenir un avocat lorsque c'est nécessaire.",
};

/**
 * Public landing page (§62).
 *
 * Server-rendered: the catalogue comes from the database (active types only), the
 * navigation knows whether the visitor is signed in, and the intake form only
 * carries the raw text to the authenticated wizard.
 */
async function loadActiveContractTypes(): Promise<SupportedContractType[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db.contractType.findMany({
      where: { active: true, status: "ACTIVE" },
      orderBy: [{ category: "asc" }, { nameFr: "asc" }],
      select: {
        code: true,
        nameFr: true,
        nameAr: true,
        descriptionFr: true,
        descriptionAr: true,
        category: true,
      },
    });
  } catch (error) {
    logger.warn("landing.catalogue_unavailable", { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export default async function LandingPage() {
  const [{ locale, d }, user, types] = await Promise.all([
    getServerI18n(),
    getCurrentUser(),
    loadActiveContractTypes(),
  ]);
  const landing = d.landing;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        locale={locale}
        nav={{
          home: d.common.nav.home,
          signIn: d.common.nav.signIn,
          signUp: d.common.nav.signUp,
          newContract: d.common.nav.newContract,
          process: landing.processTitle,
          types: landing.typesTitle,
          dashboard: d.common.nav.dashboard,
        }}
        user={user}
      />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div className="space-y-6">
              <h1 className="whitespace-pre-line text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {landing.heroTitle}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base" dir="auto">
                {landing.heroSubtitle}
              </p>
              <p className="text-xs font-medium text-primary">{landing.heroTrust}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <HeroIntake
                label={landing.heroInputLabel}
                placeholder={landing.heroInputPlaceholder}
                cta={landing.heroCta}
                examples={landing.examples}
                authenticated={Boolean(user)}
              />
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {landing.examplesTitle}
                </p>
                <Button asChild variant="link" size="sm" className="h-auto px-0">
                  <Link href="#process">
                    {landing.heroSecondaryCta}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <ProcessSteps title={landing.processTitle} subtitle={landing.processSubtitle} steps={landing.processSteps} />

        <Guarantees
          selfService={{ title: landing.selfServiceTitle, body: landing.selfServiceBody }}
          lawyer={{ title: landing.lawyerTitle, body: landing.lawyerBody }}
          secure={{ title: landing.secureTitle, body: landing.secureBody }}
          disclaimers={[
            d.common.disclaimers.notLegalAdvice,
            d.common.disclaimers.noBlanketValidity,
            d.common.disclaimers.aiAssisted,
          ]}
        />

        <DocumentTypes
          title={landing.typesTitle}
          subtitle={landing.typesSubtitle}
          more={landing.typesMore}
          moreBody={landing.typesMoreBody}
          locale={locale}
          types={types}
        />

        <Faq title={landing.faqTitle} items={landing.faq} />

        <section className="border-t border-border/60 bg-primary/5 py-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 text-start sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">{landing.ctaTitle}</h2>
            <p className="text-sm text-muted-foreground" dir="auto">
              {landing.ctaBody}
            </p>
            <Button asChild size="lg">
              <Link href={user ? "/app/contracts/new" : "/sign-in?next=%2Fapp%2Fcontracts%2Fnew"}>
                {landing.ctaButton}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter
        product={landing.footerProduct}
        legal={landing.footerLegal}
        support={landing.footerSupport}
        rights={landing.footerRights}
        disclaimer={landing.disclaimerShort}
        nav={{
          contracts: d.common.nav.contracts,
          requests: d.common.nav.requests,
          documents: d.common.nav.documents,
          signIn: d.common.nav.signIn,
        }}
      />
    </div>
  );
}
