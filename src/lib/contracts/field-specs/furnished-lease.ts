import { f, yesNo, type FieldSpec } from "../field-types";

/** Questions for a furnished residential lease (bail meublé).
 *
 * Same skeleton as the residential lease, with the furnished flag fixed to
 * true and a furniture inventory question added.
 */
export const FURNISHED_LEASE_FIELDS: FieldSpec[] = [
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
  f("durationMonths", "Durée du bail (mois)", "مدة الكراء (بالأشهر)", "NUMBER", {
    group: "terms",
    min: 1,
  }),
  f("startDate", "Date de début", "تاريخ البدء", "DATE", { group: "terms" }),
  f("rentAmountMad", "Loyer mensuel (MAD)", "الوجيبة الكرائية الشهرية (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  f("furnitureInventory", "Inventaire du mobilier", "جرد الأثاث", "TEXT", {
    group: "property",
    required: false,
    helpFr: "Listez les meubles et équipements mis à disposition.",
    helpAr: "سرد الأثاث والمعدات المتوفرة.",
  }),
  yesNo("chargesIncluded", "Les charges sont-elles incluses dans le loyer ?", "هل التكاليف مدمجة في الوجيبة؟", "financial"),
  yesNo("petsAllowed", "Les animaux sont-ils autorisés ?", "هل يُسمح بالحيوانات؟", "terms"),
];