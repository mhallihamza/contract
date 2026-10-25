import type { PartyRole } from "@prisma/client";
import type { FieldSpec } from "./field-types";
import { RESIDENTIAL_LEASE_FIELDS } from "./field-specs/residential-lease";
import { FREELANCE_SERVICE_FIELDS } from "./field-specs/freelance-service";
import { NDA_FIELDS } from "./field-specs/nda";
import { COMMERCIAL_LEASE_FIELDS } from "./field-specs/commercial-lease";
import { VEHICLE_SALE_FIELDS } from "./field-specs/vehicle-sale";
import { EMPLOYMENT_CDD_FIELDS, REAL_ESTATE_SALE_FIELDS } from "./field-specs/employment-and-property";
import { EMPLOYMENT_CDI_FIELDS } from "./field-specs/employment-cdi";
import { FURNISHED_LEASE_FIELDS } from "./field-specs/furnished-lease";
import { SEASONAL_LEASE_FIELDS } from "./field-specs/seasonal-lease";
import { LOAN_AGREEMENT_FIELDS } from "./field-specs/loan-agreement";
import { POWER_OF_ATTORNEY_FIELDS } from "./field-specs/power-of-attorney";

export { FIELD_GROUP_LABEL } from "./field-types";
export type { FieldGroup, FieldOption, FieldSpec } from "./field-types";

/** Contract type codes seeded by the platform (§45). */
export const CONTRACT_TYPE_CODES = {
  residentialLease: "RESIDENTIAL_LEASE",
  freelanceService: "FREELANCE_SERVICE",
  nda: "NDA",
  commercialLease: "COMMERCIAL_LEASE",
  vehicleSale: "VEHICLE_SALE",
  employmentCdd: "EMPLOYMENT_CDD",
  employmentCdi: "EMPLOYMENT_CDI",
  realEstateSale: "REAL_ESTATE_SALE",
  furnishedLease: "FURNISHED_LEASE",
  seasonalLease: "SEASONAL_LEASE",
  loanAgreement: "LOAN_AGREEMENT",
  powerOfAttorney: "POWER_OF_ATTORNEY",
} as const;

/**
 * Parties of a contract type (§9, §20).
 *
 * The wizard collects the parties because a contract cannot be drafted without
 * them (`validateParties` requires at least two distinct roles). The mapping is a
 * single data table — never `if (contractType === ...)` scattered in components.
 */
export const CONTRACT_TYPE_PARTY_ROLES: Record<string, PartyRole[]> = {
  RESIDENTIAL_LEASE: ["LANDLORD", "TENANT"],
  COMMERCIAL_LEASE: ["LANDLORD", "TENANT"],
  FREELANCE_SERVICE: ["SERVICE_PROVIDER", "CLIENT"],
  NDA: ["DISCLOSING_PARTY", "RECEIVING_PARTY"],
  VEHICLE_SALE: ["SELLER", "BUYER"],
  EMPLOYMENT_CDD: ["EMPLOYER", "EMPLOYEE"],
  EMPLOYMENT_CDI: ["EMPLOYER", "EMPLOYEE"],
  REAL_ESTATE_SALE: ["SELLER", "BUYER"],
  FURNISHED_LEASE: ["LANDLORD", "TENANT"],
  SEASONAL_LEASE: ["LANDLORD", "TENANT"],
  LOAN_AGREEMENT: ["LENDER", "BORROWER"],
  POWER_OF_ATTORNEY: ["OTHER", "OTHER"],
};

export function partyRolesFor(contractTypeCode: string): PartyRole[] {
  return CONTRACT_TYPE_PARTY_ROLES[contractTypeCode] ?? ["CLIENT", "OTHER"];
}

/** Bilingual role labels used by the questionnaire and the preview. */
export const PARTY_ROLE_LABEL: Record<PartyRole, { fr: string; ar: string }> = {
  LANDLORD: { fr: "Bailleur (propriétaire)", ar: "المكري (المالك)" },
  TENANT: { fr: "Locataire", ar: "المكتري" },
  SERVICE_PROVIDER: { fr: "Prestataire", ar: "مقدّم الخدمة" },
  CLIENT: { fr: "Client", ar: "العميل" },
  CUSTOMER: { fr: "Acheteur / Client", ar: "المشتري / العميل" },
  DISCLOSING_PARTY: { fr: "Partie divulgatrice", ar: "الطرف المُفشي" },
  RECEIVING_PARTY: { fr: "Partie réceptrice", ar: "الطرف المتلقّي" },
  SELLER: { fr: "Vendeur", ar: "البائع" },
  BUYER: { fr: "Acheteur", ar: "المشتري" },
  EMPLOYER: { fr: "Employeur", ar: "المشغّل" },
  EMPLOYEE: { fr: "Salarié", ar: "الأجير" },
  LENDER: { fr: "Prêteur", ar: "المُقرض" },
  BORROWER: { fr: "Emprunteur", ar: "المقترض" },
  OTHER: { fr: "Autre partie", ar: "طرف آخر" },
};

export function partyRoleLabel(role: PartyRole, locale: "fr" | "ar"): string {
  const label = PARTY_ROLE_LABEL[role];
  return locale === "ar" ? label.ar : label.fr;
}

export const FIELD_CATALOG: Record<string, FieldSpec[]> = {
  [CONTRACT_TYPE_CODES.residentialLease]: RESIDENTIAL_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.freelanceService]: FREELANCE_SERVICE_FIELDS,
  [CONTRACT_TYPE_CODES.nda]: NDA_FIELDS,
  [CONTRACT_TYPE_CODES.commercialLease]: COMMERCIAL_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.vehicleSale]: VEHICLE_SALE_FIELDS,
  [CONTRACT_TYPE_CODES.employmentCdd]: EMPLOYMENT_CDD_FIELDS,
  [CONTRACT_TYPE_CODES.employmentCdi]: EMPLOYMENT_CDI_FIELDS,
  [CONTRACT_TYPE_CODES.realEstateSale]: REAL_ESTATE_SALE_FIELDS,
  [CONTRACT_TYPE_CODES.furnishedLease]: FURNISHED_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.seasonalLease]: SEASONAL_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.loanAgreement]: LOAN_AGREEMENT_FIELDS,
  [CONTRACT_TYPE_CODES.powerOfAttorney]: POWER_OF_ATTORNEY_FIELDS,
};

export function getFieldSpecs(contractTypeCode: string): FieldSpec[] {
  return FIELD_CATALOG[contractTypeCode] ?? [];
}

export function getFieldSpec(contractTypeCode: string, key: string): FieldSpec | undefined {
  return getFieldSpecs(contractTypeCode).find((spec) => spec.key === key);
}

export function knownFieldKeys(contractTypeCode: string): string[] {
  return getFieldSpecs(contractTypeCode).map((spec) => spec.key);
}

/** Field keys a routing rule may use as condition operands for a type. */
export function routableFieldKeys(contractTypeCode: string): string[] {
  return knownFieldKeys(contractTypeCode);
}
