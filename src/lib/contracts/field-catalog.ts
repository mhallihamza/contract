import type { FieldSpec } from "./field-types";
import { RESIDENTIAL_LEASE_FIELDS } from "./field-specs/residential-lease";
import { FREELANCE_SERVICE_FIELDS } from "./field-specs/freelance-service";
import { NDA_FIELDS } from "./field-specs/nda";
import { COMMERCIAL_LEASE_FIELDS } from "./field-specs/commercial-lease";
import { VEHICLE_SALE_FIELDS } from "./field-specs/vehicle-sale";
import { EMPLOYMENT_CDD_FIELDS, REAL_ESTATE_SALE_FIELDS } from "./field-specs/employment-and-property";

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
  realEstateSale: "REAL_ESTATE_SALE",
} as const;

export const FIELD_CATALOG: Record<string, FieldSpec[]> = {
  [CONTRACT_TYPE_CODES.residentialLease]: RESIDENTIAL_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.freelanceService]: FREELANCE_SERVICE_FIELDS,
  [CONTRACT_TYPE_CODES.nda]: NDA_FIELDS,
  [CONTRACT_TYPE_CODES.commercialLease]: COMMERCIAL_LEASE_FIELDS,
  [CONTRACT_TYPE_CODES.vehicleSale]: VEHICLE_SALE_FIELDS,
  [CONTRACT_TYPE_CODES.employmentCdd]: EMPLOYMENT_CDD_FIELDS,
  [CONTRACT_TYPE_CODES.realEstateSale]: REAL_ESTATE_SALE_FIELDS,
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
