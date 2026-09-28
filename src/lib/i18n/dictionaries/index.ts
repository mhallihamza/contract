import type { AppLocale } from "@/lib/i18n/config";
import { fr } from "./fr";
import { ar } from "./ar";

/**
 * Dictionary registry.
 *
 * `fr` is the reference shape. `DeepWiden` turns its literal types (produced by
 * `as const`) into plain strings so other locales can supply their own text
 * while still being checked for structural completeness.
 */
export type DeepWiden<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepWiden<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepWiden<T[K]> }
      : T;

export type Dictionary = DeepWiden<typeof fr>;

export const dictionaries: Record<AppLocale, Dictionary> = { fr, ar };

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries.fr;
}

/** Minimal `{name}` interpolation used for statuses and messages. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
