import { f, type FieldSpec } from "../field-types";

/** Questions for an indefinite-term employment contract (CDI).
 *
 * The Code du Travail (Loi 65-99) frames the CDI as the normal form of the
 * employment relationship: no term, no end date, termination only for cause
 * or by resignation with notice. A lawyer review is required because the
 * grounds for dismissal and notice periods are legally constrained.
 */
export const EMPLOYMENT_CDI_FIELDS: FieldSpec[] = [
  f("position", "Poste occupé", "المنصب", "TEXT", { group: "employment" }),
  f("grossMonthlySalaryMad", "Salaire brut mensuel (MAD)", "الأجر الشهري الخام (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  f("workplace", "Lieu de travail", "مكان العمل", "TEXT", { group: "employment" }),
  f("weeklyHours", "Heures hebdomadaires", "عدد الساعات الأسبوعية", "NUMBER", {
    group: "employment",
    required: false,
  }),
  f("startDate", "Date de prise d'effet", "تاريخ開始 العقد", "DATE", { group: "terms" }),
  f("noticePeriodDays", "Délai de préavis (jours)", "أجل الإشعار (بأيام)", "NUMBER", {
    group: "terms",
    required: false,
    min: 0,
  }),
];