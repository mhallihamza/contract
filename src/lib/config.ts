/**
 * Central application configuration (§61).
 *
 * A final brand name is intentionally NOT hard-coded anywhere in the product:
 * every surface reads its name, support contact and language defaults from here
 * so branding can be changed without a refactor.
 */

export const SUPPORTED_LOCALES = ["fr", "ar"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Locale used when the visitor has expressed no preference. */
export const DEFAULT_LOCALE: AppLocale = (() => {
  const raw = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "fr").toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(raw) ? (raw as AppLocale) : "fr";
})();

export const LOCALE_DIRECTION: Record<AppLocale, "ltr" | "rtl"> = {
  fr: "ltr",
  ar: "rtl",
};

/** BCP-47 tags used for <html lang> and Intl formatting. */
export const LOCALE_TAGS: Record<AppLocale, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
};

export const appConfig = {
  /** Working identifier — replace with the marketing brand when decided. */
  name: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "MOROCCO_LEGAL_PLATFORM",
  shortName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "MLP",
  /**
   * Public marketing brand shown by the landing pages (navy identity).
   * Internal surfaces keep using `name`; this one is what visitors read.
   */
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "DocuMorocco",
  },
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.ma",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "",
  appUrl: process.env.APP_URL?.trim() || "http://localhost:3010",
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: SUPPORTED_LOCALES,
  /** Primary market. The routing engine refuses to guess outside it (§48). */
  primaryJurisdiction: "MA",
  currency: process.env.PAYMENT_CURRENCY?.trim() || "MAD",
  logo: {
    /** Text mark keeps the MVP logo-free until a brand asset exists. */
    text: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "MOROCCO LEGAL PLATFORM",
    favicon: "/favicon.ico",
  },
} as const;

/** Prices published in the MVP (MAD). Kept in one place for admin editing later. */
export const SERVICE_PRICING = {
  /** Generating and downloading a contract without lawyer involvement. */
  selfService: 149,
  /** Optional lawyer review requested by the client. */
  lawyerReview: 890,
  /** Lawyer review + validation where the routing engine requires it. */
  lawyerRequired: 1190,
  /** Electronic signature ceremony through the configured provider. */
  signature: 240,
} as const;

export type ServicePricingKey = keyof typeof SERVICE_PRICING;
