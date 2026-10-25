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
  /** Working name — the operator can override via env, never a dead brand. */
  name: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Wathiqa",
  shortName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Wathiqa",
  /**
   * Public marketing brand shown by the landing pages (Wathiqa identity:
   * emerald / sand / gold). Internal surfaces keep using `name`; this one is
   * what visitors read.
   */
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Wathiqa",
  },
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.ma",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "",
  /** WhatsApp business number, international digits only (e.g. 2126…). Empty = the channel is not offered at all. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim().replace(/[^0-9]/g, "") || "",
  /**
   * Demonstration notice (fail-safe): the "démonstration — données fictives"
   * mention stays visible unless the operator explicitly turns it off, so a
   * brand-new deployment never presents itself as a live merchant.
   */
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").trim().toLowerCase() !== "false",
  appUrl: process.env.APP_URL?.trim() || "http://localhost:3010",
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: SUPPORTED_LOCALES,
  /** Primary market. The routing engine refuses to guess outside it (§48). */
  primaryJurisdiction: "MA",
  currency: process.env.PAYMENT_CURRENCY?.trim() || "MAD",
  logo: {
    /** Text mark; the SVG document-and-seal mark lives in the marketing header. */
    text: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Wathiqa",
    favicon: "/favicon.ico",
  },
  /**
   * Seller identity printed on invoices. Every field is environment-driven: an
   * empty value is printed as "à compléter" rather than invented, because a
   * fake tax identity on an invoice is worse than an explicit gap.
   */
  invoice: {
    legalName: process.env.INVOICE_LEGAL_NAME?.trim() || "",
    address: process.env.INVOICE_ADDRESS?.trim() || "",
    city: process.env.INVOICE_CITY?.trim() || "",
    /** Identifiant Commun de l'Entreprise. */
    ice: process.env.INVOICE_ICE?.trim() || "",
    /** Registre de Commerce. */
    rc: process.env.INVOICE_RC?.trim() || "",
    /** Identifiant Fiscal. */
    taxId: process.env.INVOICE_TAX_ID?.trim() || "",
    email: process.env.INVOICE_EMAIL?.trim() || process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "",
  },
} as const;

/** Prices published in the MVP (MAD). Kept in one place for admin editing later. */
export const SERVICE_PRICING = {
  /** Generating and downloading a contract without lawyer involvement. */
  selfService: 290,
  /** Automated completeness/coherence verification of an existing document. */
  verificationAssisted: 79,
  /** Optional lawyer review requested by the client. */
  lawyerReview: 990,
  /** Lawyer review + validation where the routing engine requires it. */
  lawyerRequired: 1190,
  /** Electronic signature ceremony through the configured provider. */
  signature: 240,
} as const;

export type ServicePricingKey = keyof typeof SERVICE_PRICING;

/** Standard VAT rate (Morocco: 20 %). Configurable — checkout shows it. */
const DEFAULT_VAT_RATE = 0.2;

export function vatRate(source: Record<string, string | undefined> = process.env): number {
  const raw = Number(source.VAT_RATE ?? DEFAULT_VAT_RATE);
  return Number.isFinite(raw) && raw >= 0 && raw < 1 ? raw : DEFAULT_VAT_RATE;
}
