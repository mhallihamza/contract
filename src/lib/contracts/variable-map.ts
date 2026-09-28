import type { PartyRole } from "@prisma/client";
import type { CaseValue, StructuredCase } from "@/lib/legal-routing/types";

/**
 * Fact → template variable mapping (§15, §16).
 *
 * Structured facts are stored with stable camelCase keys so rules and questions
 * can reference them; approved clause templates use snake_case placeholders. The
 * translation between the two is explicit here — never inferred from the model —
 * so a renamed placeholder fails loudly instead of rendering an empty contract.
 */

/** Deterministic camelCase → snake_case conversion used as the default alias. */
export function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`).replace(/__+/g, "_");
}

/**
 * Additional placeholder names a fact may be referenced by in approved clauses.
 * Kept explicit so legal reviewers can see exactly which variable each fact feeds.
 */
export const FIELD_VARIABLE_ALIASES: Record<string, string[]> = {
  rentAmountMad: ["rent_amount", "monthly_rent"],
  securityDepositMad: ["security_deposit", "deposit_amount"],
  salePriceMad: ["sale_price", "price"],
  amountMad: ["amount", "total_amount", "contract_amount"],
  monthlySalaryMad: ["monthly_salary", "salary", "gross_salary"],
  propertyAddress: ["property_address"],
  propertyCity: ["property_city"],
  propertySurfaceM2: ["property_surface", "surface_m2"],
  vehicleRegistration: ["vehicle_registration", "plate_number"],
  vehicleVin: ["vehicle_vin", "chassis_number"],
  serviceDescription: ["service_description", "scope"],
  confidentialityScope: ["confidentiality_scope"],
  durationMonths: ["duration_months", "duration"],
  noticePeriodDays: ["notice_period_days"],
  startDate: ["start_date", "contract_start_date"],
  endDate: ["end_date", "contract_end_date"],
  deliveryDate: ["delivery_date"],
  paymentSchedule: ["payment_schedule"],
  trialPeriodMonths: ["trial_period_months"],
  workLocation: ["work_location"],
  jobTitle: ["job_title"],
};

/** Variable prefix per party role (`LANDLORD` → `landlord_name`). */
export const PARTY_VARIABLE_PREFIX: Record<PartyRole, string> = {
  LANDLORD: "landlord",
  TENANT: "tenant",
  SERVICE_PROVIDER: "provider",
  CLIENT: "client",
  CUSTOMER: "customer",
  DISCLOSING_PARTY: "disclosing_party",
  RECEIVING_PARTY: "receiving_party",
  SELLER: "seller",
  BUYER: "buyer",
  EMPLOYER: "employer",
  EMPLOYEE: "employee",
  LENDER: "lender",
  BORROWER: "borrower",
  OTHER: "other",
};

export interface PartyFacts {
  role: PartyRole;
  fullName: string;
  address: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  companyName: string | null;
  companyTaxId: string | null;
  representative: string | null;
}

/**
 * Builds the render variables for a contract: every fact under its own key, its
 * snake_case form and its declared aliases, plus one set of placeholders per party.
 */
export function buildTemplateVariables(
  caseData: StructuredCase,
  parties: readonly PartyFacts[],
): StructuredCase {
  const variables: StructuredCase = {};

  for (const [key, value] of Object.entries(caseData)) {
    if (value === undefined || value === null || value === "") continue;
    variables[key] = value;
    variables[toSnakeCase(key)] = value;
    for (const alias of FIELD_VARIABLE_ALIASES[key] ?? []) variables[alias] = value;
  }

  for (const party of parties) {
    const prefix = PARTY_VARIABLE_PREFIX[party.role] ?? "party";
    const entries: [string, CaseValue][] = [
      [`${prefix}_name`, party.companyName || party.fullName],
      [`${prefix}_legal_name`, party.companyName ?? party.fullName],
      [`${prefix}_address`, party.address],
      [`${prefix}_city`, party.city],
      [`${prefix}_email`, party.email],
      [`${prefix}_phone`, party.phone],
      [`${prefix}_cin`, party.nationalId],
      [`${prefix}_ice`, party.companyTaxId],
      [`${prefix}_representative`, party.representative],
    ];
    for (const [key, value] of entries) {
      if (value === undefined || value === null || value === "") continue;
      variables[key] = value;
    }
  }

  return variables;
}
