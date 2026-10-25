import type { ReactNode } from "react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { getCurrentUser } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";

/**
 * Shell of the public experience (§6, §18, §27).
 *
 * One bar, one footer, one neutral canvas for every visitor-facing route —
 * the homepage, the catalogue, a document page, the assistant and the guest
 * journey (questionnaire, tracking). The signed-in user is resolved server-side
 * so the bar can offer "Mon espace" instead of "Connexion"; nothing about the
 * visitor's role is ever supplied by the client.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [{ locale, d }, user] = await Promise.all([getServerI18n(), getCurrentUser()]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {d.public.nav.skipToContent}
      </a>

      <PublicHeader
        locale={locale}
        nav={d.public.nav}
        announcement={d.public.home.announcement}
        user={user}
      />

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <SiteFooter
        labels={d.public.home.footer}
        /** The demonstration notice is fail-safe: it only disappears when the
            operator explicitly disabled demo mode in the configuration. */
        rights={appConfig.demoMode ? d.landing.footerRights : ""}
      />
    </div>
  );
}
