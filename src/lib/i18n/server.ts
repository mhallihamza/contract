import { cookies } from "next/headers";
import { LOCALE_COOKIE, localeDirection, resolveLocale, type AppLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

/** Locale for the current request, read from the cookie set by the switcher. */
export async function getServerLocale(): Promise<AppLocale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export interface ServerI18n {
  locale: AppLocale;
  dir: "ltr" | "rtl";
  d: Dictionary;
}

export async function getServerI18n(): Promise<ServerI18n> {
  const locale = await getServerLocale();
  return { locale, dir: localeDirection(locale), d: getDictionary(locale) };
}
