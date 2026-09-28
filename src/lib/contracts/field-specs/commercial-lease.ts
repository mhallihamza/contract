import { f, yesNo, type FieldSpec } from "../field-types";

/** Questions for a commercial premises lease (bail commercial). */
export const COMMERCIAL_LEASE_FIELDS: FieldSpec[] = [
  f("businessActivity", "Activité exercée dans le local", "النشاط الممارس بالمحل", "TEXT", { group: "context" }),
  f("premisesAddress", "Adresse du local", "عنوان المحل", "TEXT", { group: "property" }),
  f("premisesCity", "Ville", "المدينة", "TEXT", { group: "property" }),
  f("durationYears", "Durée du bail (années)", "مدة الكراء (بالسنوات)", "NUMBER", { group: "terms", min: 1 }),
  f("rentAmountMad", "Loyer mensuel (MAD)", "الوجيبة الشهرية (درهم)", "NUMBER", { group: "financial", min: 0 }),
  f("securityDepositMad", "Dépôt de garantie (MAD)", "الضمانة (درهم)", "NUMBER", {
    group: "financial",
    required: false,
  }),
  yesNo("renewalOption", "Option de renouvellement prévue ?", "هل يُنص على خيار التجديد؟", "terms"),
];
