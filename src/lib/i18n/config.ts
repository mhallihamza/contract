import { DEFAULT_LOCALE, LOCALE_DIRECTION, LOCALE_TAGS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/config";

/**
 * i18n architecture (§6).
 *
 * - UI strings live in typed dictionaries (fr / ar) — never inline in components.
 * - The locale is stored in a cookie, so both server and client components can
 *   resolve the same value without hydration mismatches.
 * - Arabic renders RTL via <html dir>, French LTR.
 */

export type { AppLocale };
export const locales = SUPPORTED_LOCALES;
export const defaultLocale = DEFAULT_LOCALE;

export const LOCALE_COOKIE = "mlp.locale";

export function isLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): AppLocale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeDirection(locale: AppLocale): "ltr" | "rtl" {
  return LOCALE_DIRECTION[locale];
}

export function localeTag(locale: AppLocale): string {
  return LOCALE_TAGS[locale];
}

/** Human label shown in the language switcher. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: "Français",
  ar: "العربية",
};

/** Maps the platform language enum (Prisma) to a UI locale. */
export function languageToLocale(language: "AR" | "FR" | "EN" | string): AppLocale {
  const lower = language.toLowerCase();
  return lower === "ar" ? "ar" : "fr";
}

export function localeToLanguage(locale: AppLocale): "AR" | "FR" {
  return locale === "ar" ? "AR" : "FR";
}

/** Picks the localised value of a bilingual (ar/fr) database row. */
export function pickLocalized(
  locale: AppLocale,
  values: { ar?: string | null; fr?: string | null },
  fallback = "",
): string {
  const primary = locale === "ar" ? values.ar : values.fr;
  const secondary = locale === "ar" ? values.fr : values.ar;
  return primary || secondary || fallback;
}
