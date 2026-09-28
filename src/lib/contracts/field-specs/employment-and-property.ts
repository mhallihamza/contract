import { f, type FieldSpec } from "../field-types";

/** Questions for a fixed-term employment contract (out of online scope — §45). */
export const EMPLOYMENT_CDD_FIELDS: FieldSpec[] = [
  f("position", "Poste occupé", "المنصب", "TEXT", { group: "employment" }),
  f("grossMonthlySalaryMad", "Salaire brut mensuel (MAD)", "الأجر الشهري الخام (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  f("contractStartDate", "Date de début", "تاريخ البدء", "DATE", { group: "terms" }),
  f("contractEndDate", "Date de fin", "تاريخ النهاية", "DATE", { group: "terms" }),
  f("workplace", "Lieu de travail", "مكان العمل", "TEXT", { group: "employment" }),
  f("weeklyHours", "Heures hebdomadaires", "عدد الساعات الأسبوعية", "NUMBER", {
    group: "employment",
    required: false,
  }),
];

/** Questions for an immovable property sale (handled by a notary — §45). */
export const REAL_ESTATE_SALE_FIELDS: FieldSpec[] = [
  f("propertyAddress", "Adresse du bien", "عنوان العقار", "TEXT", { group: "property" }),
  f("propertyCity", "Ville", "المدينة", "TEXT", { group: "property" }),
  f("landRegistryRef", "Référence de la conservation foncière", "مرجع المحافظة العقارية", "TEXT", {
    group: "property",
    required: false,
  }),
  f("salePriceMad", "Prix de vente (MAD)", "ثمن البيع (درهم)", "NUMBER", { group: "financial", min: 0 }),
];
