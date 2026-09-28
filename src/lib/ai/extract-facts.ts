import { CITY_LEXICON, normalizeText } from "./intent-lexicon";

/**
 * Regex fact extraction used by the deterministic provider and as a
 * cross-check for model output. Only values that appear verbatim in the user's
 * text are extracted: facts are never guessed.
 */

export function parseFlexibleNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "");
  // "10.000" / "10,000" / "10000" / "10.000,50"
  const normalized = cleaned.includes(",") && cleaned.includes(".")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}([.,]\d{3})+$/.test(cleaned)
      ? cleaned.replace(/[.,]/g, "")
      : cleaned.replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const MONTH_WORDS: Record<string, number> = {
  "شهرين": 2,
  "شهر": 1,
  "أشهر": 0,
  "اشهر": 0,
  "mois": 0,
  "شهرا": 0,
};

const YEAR_WORDS: Record<string, number> = {
  "عام": 1,
  "عاما": 1,
  "عامين": 2,
  "سنة": 1,
  "سنتين": 2,
  "سنوات": 0,
  "ans": 0,
  "an": 1,
  "année": 1,
  "annee": 1,
  "années": 0,
  "annees": 0,
};

export function extractDurationMonths(text: string): number | undefined {
  const normalized = normalizeText(text);

  const explicitMonths = normalized.match(/(\d+)\s*(شهر|اشهر|أشهر|mois)/);
  if (explicitMonths) return Number(explicitMonths[1]);

  const explicitYears = normalized.match(/(\d+)\s*(عام|سنوات|سنه|سنة|ans|an|année|annee)/);
  if (explicitYears) return Number(explicitYears[1]) * 12;

  for (const [word, months] of Object.entries(MONTH_WORDS)) {
    if (months > 0 && normalized.includes(word)) return months;
  }
  for (const [word, years] of Object.entries(YEAR_WORDS)) {
    if (years > 0 && new RegExp(`(^|\\s)${word}(\\s|$)`).test(normalized)) return years * 12;
  }
  if (normalized.includes("سنتين")) return 24;
  if (normalized.includes("عامين")) return 24;
  return undefined;
}

export function extractAmounts(text: string): number[] {
  const results: number[] = [];
  const pattern = /(\d[\d\s.,]*)\s*(dh|dhs|mad|dirhams?|درهم|دراهم)/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const value = parseFlexibleNumber(match[1]);
    if (value !== null) results.push(value);
  }
  return results;
}

export function extractMileageKm(text: string): number | undefined {
  const match = text.match(/(\d[\d\s.,]*)\s*(km|كلم|كيلومتر)/i);
  if (!match) return undefined;
  return parseFlexibleNumber(match[1]) ?? undefined;
}

export function extractCity(text: string): string | undefined {
  const normalized = normalizeText(text);
  for (const city of CITY_LEXICON) {
    if (city.aliases.some((alias) => normalized.includes(normalizeText(alias)))) return city.value;
  }
  return undefined;
}

export function extractFurnished(text: string): boolean | undefined {
  const normalized = normalizeText(text);
  if (/(مفروش|meublé|meuble)/.test(normalized)) return true;
  if (/(غير مفروش|non meublé|non meuble)/.test(normalized)) return false;
  return undefined;
}

export function extractVehicleHints(text: string): { make?: string; model?: string; registration?: string } {
  const hints: { make?: string; model?: string; registration?: string } = {};
  const makes = ["dacia", "renault", "peugeot", "citroen", "citroën", "toyota", "hyundai", "volkswagen", "ford", "fiat", "mercedes", "bmw", "kia"];
  const lower = text.toLowerCase();
  for (const make of makes) {
    if (lower.includes(make)) {
      hints.make = make.charAt(0).toUpperCase() + make.slice(1);
      break;
    }
  }
  const registration = text.match(/\b(\d{1,6})\s*[-–]?\s*([A-Za-z\u0600-\u06FF]{1,2})\s*[-–]?\s*(\d{1,3})\b/);
  if (registration) hints.registration = registration[0].replace(/\s+/g, " ").trim();
  return hints;
}

export function extractDates(text: string): string[] {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/g) ?? [];
  const french = text.match(/\b\d{1,2}\/\d{1,2}\/20\d{2}\b/g) ?? [];
  return [...iso, ...french];
}

export interface ExtractedFacts {
  [key: string]: string | number | boolean;
}

/** Field-key aware extraction used before the questionnaire is completed. */
export function extractKnownFields(text: string, fieldKeys: string[]): ExtractedFacts {
  const facts: ExtractedFacts = {};
  const has = (key: string) => fieldKeys.length === 0 || fieldKeys.includes(key);

  if (has("durationMonths") || has("durationYears")) {
    const months = extractDurationMonths(text);
    if (months !== undefined) {
      if (has("durationMonths")) facts.durationMonths = months;
      if (has("durationYears") && months % 12 === 0) facts.durationYears = months / 12;
    }
  }

  const amounts = extractAmounts(text);
  if (amounts.length > 0) {
    const first = amounts[0]!;
    if (has("rentAmountMad")) facts.rentAmountMad = first;
    if (has("amountMad")) facts.amountMad = first;
    if (has("salePriceMad")) facts.salePriceMad = first;
    if (has("securityDepositMad") && amounts.length > 1) facts.securityDepositMad = amounts[1]!;
  }

  const city = extractCity(text);
  if (city) {
    if (has("propertyCity")) facts.propertyCity = city;
    if (has("premisesCity")) facts.premisesCity = city;
  }

  const furnished = extractFurnished(text);
  if (furnished !== undefined && has("furnished")) facts.furnished = furnished;

  const mileage = extractMileageKm(text);
  if (mileage !== undefined && has("mileageKm")) facts.mileageKm = mileage;

  if (has("vehicleMake") || has("vehicleModel") || has("registrationNumber")) {
    const vehicle = extractVehicleHints(text);
    if (vehicle.make && has("vehicleMake")) facts.vehicleMake = vehicle.make;
    if (vehicle.model && has("vehicleModel")) facts.vehicleModel = vehicle.model;
    if (vehicle.registration && has("registrationNumber")) facts.registrationNumber = vehicle.registration;
  }

  return facts;
}
