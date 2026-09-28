import type { AppLocale } from "@/lib/i18n/config";

/**
 * Locale-aware formatting helpers usable in server components.
 *
 * The client equivalent lives in `@/lib/i18n/provider` (for hooks); these keep
 * server-rendered pages free of the client i18n context.
 */

function intlLocale(locale: AppLocale): string {
  return locale === "ar" ? "ar-MA" : "fr-MA";
}

/** Accepted numeric inputs: Prisma `Decimal`, numbers and numeric strings. */
type NumericInput = number | string | { toString(): string } | null | undefined;

function toNumber(value: NumericInput): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatMoney(amount: NumericInput, currency: string, locale: AppLocale): string {
  const numeric = toNumber(amount);
  if (numeric === null) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(value: Date | string | null | undefined, locale: AppLocale): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale: AppLocale): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: NumericInput, locale: AppLocale): string {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  return new Intl.NumberFormat(intlLocale(locale)).format(numeric);
}
