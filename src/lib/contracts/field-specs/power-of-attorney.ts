import { f, type FieldSpec } from "../field-types";

/** Questions for a power of attorney (procuration / tawkila).
 *
 * A mandate given by one person (mandant) to another (mandataire) to act on
 * their behalf. Routable only for limited, clearly defined administrative acts;
 * not for real-estate transactions (those need a notary).
 */
export const POWER_OF_ATTORNEY_FIELDS: FieldSpec[] = [
  f("mandantName", "Nom du mandant", "الشخص الموكل", "TEXT", { group: "context" }),
  f("mandataireName", "Nom du mandataire", "نائب الوكيل", "TEXT", { group: "context" }),
  f("mandatePurpose", "Objet de la procuration", "غرض الوكالة", "TEXT", {
    group: "service",
    helpFr: "Actes précis confiés au mandataire (ex. : retirer un document, représenter à une administration).",
    helpAr: "الأعمال المحددة الموكل بها للوكيل (مثال: سحب وثيقة، التمثيل لدى إدارة).",
  }),
  f("mandateScope", "Portée géographique et matérielle", "نطاق المكان والموضوع", "TEXT", {
    group: "service",
    required: false,
  }),
  f("mandateStartDate", "Date de début", "تاريخ البدء", "DATE", { group: "terms" }),
  f("mandateEndDate", "Date de fin", "تاريخ النهاية", "DATE", { group: "terms", required: false }),
];