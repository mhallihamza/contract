import { f, yesNo, type FieldSpec } from "../field-types";

/** Questions for a residential / professional use lease (durée, loyer, dépôt…). */
export const RESIDENTIAL_LEASE_FIELDS: FieldSpec[] = [
  f("clientRole", "Votre rôle dans le contrat", "صفّتك في العقد", "SELECT", {
    group: "context",
    options: [
      { value: "LANDLORD", fr: "Bailleur (propriétaire)", ar: "المكري (المالك)" },
      { value: "TENANT", fr: "Locataire", ar: "المكتري" },
    ],
  }),
  f("propertyType", "Type de bien", "نوع المحل", "SELECT", {
    group: "property",
    options: [
      { value: "APARTMENT", fr: "Appartement", ar: "شقة" },
      { value: "HOUSE", fr: "Maison", ar: "دار" },
      { value: "ROOM", fr: "Chambre", ar: "غرفة" },
      { value: "STUDIO", fr: "Studio", ar: "استوديو" },
    ],
  }),
  f("propertyAddress", "Adresse du bien", "عنوان المحل", "TEXT", { group: "property" }),
  f("propertyCity", "Ville", "المدينة", "TEXT", { group: "property" }),
  f("propertySurfaceM2", "Surface (m²)", "المساحة (م²)", "NUMBER", { group: "property", required: false }),
  yesNo("furnished", "Le bien est-il meublé ?", "هل المحل مفروش؟", "property"),
  f("durationMonths", "Durée du bail (mois)", "مدة الكراء (بالأشهر)", "NUMBER", {
    group: "terms",
    min: 1,
    helpFr: "La durée déclarée sert aussi au calcul des règles applicables.",
    helpAr: "المدة المُصرّح بها تُستعمل أيضاً لتطبيق القواعد المناسبة.",
  }),
  f("startDate", "Date de début", "تاريخ البدء", "DATE", { group: "terms" }),
  f("rentAmountMad", "Loyer mensuel (MAD)", "الوجيبة الكرائية الشهرية (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  f("paymentFrequency", "Périodicité du paiement", "دورية الأداء", "SELECT", {
    group: "financial",
    options: [
      { value: "MONTHLY", fr: "Mensuelle", ar: "شهرية" },
      { value: "QUARTERLY", fr: "Trimestrielle", ar: "كل ثلاثة أشهر" },
      { value: "YEARLY", fr: "Annuelle", ar: "سنوية" },
    ],
  }),
  f("securityDepositMad", "Dépôt de garantie (MAD)", "الضمانة (درهم)", "NUMBER", {
    group: "financial",
    required: false,
    min: 0,
  }),
  yesNo("chargesIncluded", "Les charges sont-elles incluses dans le loyer ?", "هل التكاليف مدمجة في الوجيبة؟", "financial"),
  yesNo("petsAllowed", "Les animaux sont-ils autorisés ?", "هل يُسمح بالحيوانات؟", "terms"),
];
