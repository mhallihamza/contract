/**
 * Lexicon for the deterministic provider.
 *
 * Moroccan Darija, Modern Standard Arabic and French formulations are mapped to
 * the platform's intent codes. This keeps the demo and the tests fully offline
 * and reproducible: no network, no non-determinism.
 */

export interface IntentLexiconEntry {
  /** Intent code proposed to the routing/intent layer. */
  intentCode: string;
  /** Contract type code from the catalogue that this intent maps to. */
  contractTypeCode: string;
  keywords: string[];
}

export const INTENT_LEXICON: IntentLexiconEntry[] = [
  {
    intentCode: "RENT_RESIDENTIAL_PROPERTY",
    contractTypeCode: "RESIDENTIAL_LEASE",
    keywords: [
      "نكري",
      "كنكري",
      "بغيت نكري",
      "كراء",
      "الكري",
      "كرا",
      "ايجار",
      "إيجار",
      "المكتري",
      "المكري",
      "louer",
      "location appartement",
      "bail d'habitation",
      "bail habitation",
      "loyer",
      "locataire",
      "propriétaire",
    ],
  },
  {
    intentCode: "COMMERCIAL_LEASE",
    contractTypeCode: "COMMERCIAL_LEASE",
    keywords: [
      "محل تجاري",
      "كراء تجاري",
      "بكري المحل",
      "المحل التجاري",
      "bail commercial",
      "local commercial",
      "locaux commerciaux",
      "commerce",
    ],
  },
  {
    intentCode: "FREELANCE_SERVICE",
    contractTypeCode: "FREELANCE_SERVICE",
    keywords: [
      "فريلانسر",
      "مستقل",
      "خدمة",
      "الخدمات",
      "مطور",
      "موقع",
      "تصميم",
      "برمجة",
      "freelance",
      "prestataire",
      "prestation",
      "mission",
      "site web",
      "développeur",
      "developpeur",
      "consultant",
    ],
  },
  {
    intentCode: "PROTECT_CONFIDENTIAL_INFORMATION",
    contractTypeCode: "NDA",
    keywords: [
      "سري",
      "سرية",
      "معلومات سرية",
      "اتفاقية سرية",
      "عدم الافصاح",
      "عدم الإفصاح",
      "nda",
      "confidentialité",
      "confidentiel",
      "non-divulgation",
      "secret",
    ],
  },
  {
    intentCode: "SELL_VEHICLE",
    contractTypeCode: "VEHICLE_SALE",
    keywords: [
      "طوموبيل",
      "الطوموبيل",
      "سيارة",
      "نبيع السيارة",
      "بيع الطوموبيل",
      "voiture",
      "véhicule",
      "vehicule",
      "vente de voiture",
      "automobile",
    ],
  },
  {
    intentCode: "EMPLOYMENT",
    contractTypeCode: "EMPLOYMENT_CDD",
    keywords: [
      "توظيف",
      "عقد شغل",
      "موظف",
      "شغل",
      "اجير",
      "أجير",
      "contrat de travail",
      "cdd",
      "embauche",
      "employé",
      "salaire",
    ],
  },
  {
    intentCode: "SELL_REAL_ESTATE",
    contractTypeCode: "REAL_ESTATE_SALE",
    keywords: [
      "بيع دار",
      "بيع ارض",
      "بيع أرض",
      "عقار",
      "شقة للبيع",
      "موثق",
      "vente immobilière",
      "terrain",
      "appartement à vendre",
      "notaire",
    ],
  },
];

/** Cities used to pre-fill the property location from free text. */
export const CITY_LEXICON: { value: string; aliases: string[] }[] = [
  { value: "Casablanca", aliases: ["casablanca", "الدار البيضاء", "الدارالبيضاء", "كازا", "casa"] },
  { value: "Rabat", aliases: ["rabat", "الرباط"] },
  { value: "Marrakech", aliases: ["marrakech", "مراكش"] },
  { value: "Fès", aliases: ["fes", "fès", "فاس"] },
  { value: "Tanger", aliases: ["tanger", "طنجة"] },
  { value: "Agadir", aliases: ["agadir", "أكادير", "اكادير"] },
  { value: "Oujda", aliases: ["oujda", "وجدة"] },
  { value: "Kénitra", aliases: ["kenitra", "kénitra", "القنيطرة"] },
  { value: "Meknès", aliases: ["meknes", "meknès", "مكناس"] },
  { value: "Salé", aliases: ["sale", "salé", "سلا"] },
];

/** How long the platform's lexicon recognises Arabic-script input. */
export function looksArabic(text: string): boolean {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  return arabic >= Math.max(2, text.replace(/\s/g, "").length * 0.2);
}

export function looksDarija(text: string): boolean {
  return /(بغيت|ديالي|ديالنا|دير|شنو|واش|كيفاش|عافاك|ديال|بزاف|ماشي|خاصني)/.test(text);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}
