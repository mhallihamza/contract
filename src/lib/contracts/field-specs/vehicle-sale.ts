import { f, type FieldSpec } from "../field-types";

/** Questions for a vehicle sale (vente de véhicule). */
export const VEHICLE_SALE_FIELDS: FieldSpec[] = [
  f("vehicleMake", "Marque", "الماركة", "TEXT", { group: "vehicle" }),
  f("vehicleModel", "Modèle", "الطراز", "TEXT", { group: "vehicle" }),
  f("registrationNumber", "Numéro d'immatriculation", "رقم التسجيل", "TEXT", { group: "vehicle" }),
  f("firstRegistrationDate", "Date de première mise en circulation", "تاريخ أول سير", "DATE", {
    group: "vehicle",
    required: false,
  }),
  f("mileageKm", "Kilométrage", "عدد الكيلومترات", "NUMBER", { group: "vehicle", min: 0, required: false }),
  f("salePriceMad", "Prix de vente (MAD)", "ثمن البيع (درهم)", "NUMBER", { group: "financial", min: 0 }),
  f("paymentMode", "Moyen de paiement", "طريقة الأداء", "SELECT", {
    group: "financial",
    options: [
      { value: "CASH", fr: "Espèces", ar: "نقداً" },
      { value: "BANK_TRANSFER", fr: "Virement bancaire", ar: "تحويل بنكي" },
      { value: "CHEQUE", fr: "Chèque", ar: "شيك" },
    ],
  }),
  f("saleDate", "Date de la vente", "تاريخ البيع", "DATE", { group: "terms" }),
];
