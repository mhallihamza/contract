import { f, type FieldSpec } from "../field-types";

/** Questions for a loan agreement between individuals (prêt entre particuliers).
 *
 * Governed by the Dahir des Obligations et des Contrats (freedom of contract).
 * A written loan is required above a certain threshold; interest is regulated.
 */
export const LOAN_AGREEMENT_FIELDS: FieldSpec[] = [
  f("lenderName", "Nom du prêteur", "اسم المقرض", "TEXT", { group: "context" }),
  f("borrowerName", "Nom de l'emprunteur", "اسم المقترض", "TEXT", { group: "context" }),
  f("loanAmountMad", "Montant prêté (MAD)", "مبلغ القرض (درهم)", "NUMBER", {
    group: "financial",
    min: 0,
  }),
  f("interestRate", "Taux d'intérêt annuel (%)", "نسبة الفائدة السنوية (% n°)", "NUMBER", {
    group: "financial",
    required: false,
    min: 0,
    max: 100,
  }),
  f("repaymentTerms", "Modalités de remboursement", "شروط السداد", "TEXT", {
    group: "financial",
    helpFr: "Échéances, montant de chaque échéance, dates de paiement.",
    helpAr: "الأقساط، مبلغ كل قسط، تواريخ الأداء.",
  }),
  f("loanDate", "Date de mise à disposition", "تاريخ وضع القرض تحت تصرف المقترض", "DATE", { group: "terms" }),
];