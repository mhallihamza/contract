import { f, type FieldSpec } from "../field-types";

/** Questions for a freelance / service agreement. */
export const FREELANCE_SERVICE_FIELDS: FieldSpec[] = [
  f("clientRole", "Votre rôle", "صفّتك", "SELECT", {
    group: "context",
    options: [
      { value: "CLIENT", fr: "Client (commanditaire)", ar: "العميل (صاحب الطلب)" },
      { value: "SERVICE_PROVIDER", fr: "Prestataire (freelance)", ar: "مزود الخدمة (فريلانسر)" },
    ],
  }),
  f("serviceDescription", "Description de la prestation", "وصف الخدمة", "TEXT", {
    group: "service",
    helpFr: "Décrivez le travail attendu avec vos mots.",
    helpAr: "اوصف العمل المنتظر بكلماتك.",
  }),
  f("deliverables", "Livrables attendus", "المخرجات المنتظرة", "TEXT", { group: "service", required: false }),
  f("amountMad", "Montant total (MAD)", "المبلغ الإجمالي (درهم)", "NUMBER", { group: "financial", min: 0 }),
  f("paymentSchedule", "Modalité de paiement", "طريقة الأداء", "SELECT", {
    group: "financial",
    options: [
      { value: "SINGLE", fr: "Paiement unique", ar: "أداء واحد" },
      { value: "INSTALMENTS", fr: "Paiement échelonné", ar: "أداء بالتقسيط" },
      { value: "MONTHLY", fr: "Mensualisé", ar: "أداء شهري" },
    ],
  }),
  f("startDate", "Date de début", "تاريخ البدء", "DATE", { group: "terms" }),
  f("endDate", "Date de fin prévue", "تاريخ النهاية المتوقع", "DATE", { group: "terms", required: false }),
  f("latePaymentPenalty", "Prévoir une pénalité de retard ?", "هل يُنص على غرامة التأخير؟", "BOOLEAN", {
    group: "financial",
    required: false,
  }),
  f("ipAssignment", "Cession des droits sur les livrables", "التنازل عن الحقوق على المخرجات", "BOOLEAN", {
    group: "service",
    required: false,
  }),
  f("confidentialityIncluded", "Inclure une clause de confidentialité", "إدراج بند السرية", "BOOLEAN", {
    group: "service",
    required: false,
  }),
];
