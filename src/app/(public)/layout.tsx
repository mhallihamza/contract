import type { ReactNode } from "react";
import { SiteFooter } from "@/components/landing/site-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getServerI18n } from "@/lib/i18n/server";

/**
 * Public (catalogue-first) shell (§35).
 *
 * Everything a visitor can use before any account exists lives under this group:
 * the catalogue, the product pages, the assistant, the guest questionnaire, the
 * checkout and the order tracking page.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [{ locale, d }, user] = await Promise.all([getServerI18n(), getCurrentUser()]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        locale={locale}
        nav={{
          contracts: d.public.nav.contracts,
          how: d.public.nav.how,
          help: d.public.nav.help,
          signIn: d.public.nav.signIn,
          mySpace: d.public.nav.mySpace,
        }}
        user={user}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        product={d.landing.footerProduct}
        legal={d.landing.footerLegal}
        support={d.landing.footerSupport}
        rights={d.landing.footerRights}
        disclaimer={d.landing.disclaimerShort}
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
