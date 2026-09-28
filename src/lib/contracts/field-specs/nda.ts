import { f, yesNo, type FieldSpec } from "../field-types";

/** Questions for a confidentiality (NDA) agreement. */
export const NDA_FIELDS: FieldSpec[] = [
  f("disclosureDirection", "Sens de la confidentialité", "اتجاه السرية", "SELECT", {
    group: "confidentiality",
    options: [
      { value: "ONE_WAY", fr: "Une partie divulgue", ar: "طرف واحد يفشي" },
      { value: "MUTUAL", fr: "Échange réciproque", ar: "تبادل متبادل" },
    ],
  }),
  f("confidentialScope", "Informations concernées", "المعلومات المعنية", "TEXT", {
    group: "confidentiality",
    helpFr: "Ex. : données clients, code source, conditions commerciales.",
    helpAr: "مثال: معطيات العملاء، الشفرة المصدرية، الشروط التجارية.",
  }),
  f("purpose", "Objectif de la divulgation", "الغرض من الإفصاح", "TEXT", {
    group: "context",
    required: false,
  }),
  f("durationYears", "Durée de confidentialité (années)", "مدة السرية (بالسنوات)", "NUMBER", {
    group: "terms",
    min: 1,
  }),
  yesNo("returnOfMaterials", "Restitution des supports prévue ?", "هل يُنص على إرجاع الوثائق؟", "confidentiality"),
];
