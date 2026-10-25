import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/**
 * Public sitemap (§6).
 *
 * Only the surfaces a visitor may open anonymously: the home page, the
 * catalogue and every published document page, the verification entry point,
 * the assistant and the legal notice. Private or token-bound surfaces (sign-in,
 * application, back offices, guest/verify tokens) are deliberately absent —
 * they will not be indexed (robots.ts) and must never leak into a sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appConfig.appUrl.replace(/\/$/, "");
  const lastModified = new Date();

  const staticRoutes = ["", "/contracts", "/verify", "/assistant", "/legal"];

  /** Public URL segments of the seeded contract types (mirrors scripts/seed-data/contract-types.ts). */
  const catalogueSlugs = [
    "contrat-location-habitation",
    "contrat-prestation-services",
    "accord-confidentialite-nda",
    "bail-commercial",
    "contrat-vente-vehicule",
    "contrat-travail-cdd",
    "compromis-vente-immobiliere",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...catalogueSlugs.map((slug) => ({
      url: `${base}/contracts/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
