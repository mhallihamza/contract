"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface I18nValue {
  locale: AppLocale;
  dir: "ltr" | "rtl";
  d: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dir,
  dictionary,
  children,
}: {
  locale: AppLocale;
  dir: "ltr" | "rtl";
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => ({ locale, dir, d: dictionary }), [locale, dir, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Access the active locale and dictionary from a client component. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

/** Locale-aware date formatting (fr-MA / ar-MA). */
export function formatDate(value: Date | string | null | undefined, locale: AppLocale): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale: AppLocale): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMoney(amount: number | string | null | undefined, currency: string, locale: AppLocale): string {
  if (amount === null || amount === undefined) return "—";
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}
