import { f, yesNo, type FieldSpec } from "../field-types";

/** Questions for a seasonal / vacation lease (bail saisonnier).
 *
 * Short-term furnished rental, typically for tourism. Fixed end date and
 * no tacit renewal.
 */
export const SEASONAL_LEASE_FIELDS: FieldSpec[] = [
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
      { value: "VILLA", fr: "Villa", ar: "فيلا" },
      { value: "STUDIO", fr: "Studio", ar: "استوديو" },
    ],
  }),
  f("propertyAddress", "Adresse du bien", "عنوان المحل", "TEXT", { group: "property" }),
  f("propertyCity", "Ville", "المدينة", "TEXT", { group: "property" }),
  f("startDate", "Date de début du séjour", "تاريخ بداية الإقامة", "DATE", { group: "terms" }),
  f("endDate", "Date de fin du séjour", "تاريخ نهاية الإقامة", "DATE", { group: "terms" }),
  f("rentAmountMad", "Loyer total du séjour (MAD)", "مجموع الوجيبة خلال الإقامة (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  yesNo("chargesIncluded", "Les charges sont-elles incluses ?", "هل التكاليف مدمجة؟", "financial"),
  yesNo("petsAllowed", "Les animaux sont-ils autorisés ?", "هل يُسمح بالحيوانات؟", "terms"),
];