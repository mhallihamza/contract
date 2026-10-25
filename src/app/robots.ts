import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/**
 * Crawler rules mirroring the actual surface map (§6, §48).
 *
 * Everything a visitor can open anonymously is crawlable. The application
 * spaces (client, lawyer, admin), the API and every token-bound page (guest
 * journey, verification follow-up, dossier) are excluded — their content is
 * either private or one-time, and indexing them would leak case URLs.
 */
export default function robots(): MetadataRoute.Robots {
  const base = appConfig.appUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/contracts", "/verify", "/assistant", "/legal"],
        disallow: ["/api/", "/app/", "/admin/", "/lawyer/", "/sign-in", "/dossier/", "/start/", "/verify/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
