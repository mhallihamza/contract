import { z } from "zod";

/**
 * Input validation for the public (guest) endpoints (§38).
 *
 * Everything a browser can send is validated here before it reaches a domain
 * service: answers, contact e-mail, chosen offer. Amounts, owners, statuses and
 * roles are never part of these schemas — they are decided server-side.
 */

/** Answers are keyed by field key; values are normalised by the field catalogue. */
export const guestAnswersSchema = z.object({
  values: z.record(z.string().min(1).max(60), z.unknown()),
});

export const guestEmailSchema = z.object({
  email: z.string().trim().email().max(180),
});

export const guestServiceChoiceSchema = z.object({
  offerKey: z.enum(["SELF_SERVICE", "LAWYER_REVIEW", "LAWYER_REQUIRED", "SIGNATURE"]),
});

export const guestPartySchema = z.object({
  role: z.string().min(2).max(40),
  partyType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  fullName: z.string().trim().min(2).max(180),
  companyName: z.string().trim().max(180).optional().nullable(),
  companyTaxId: z.string().trim().max(60).optional().nullable(),
  nationalId: z.string().trim().max(60).optional().nullable(),
  representative: z.string().trim().max(180).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(180).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(40).optional().nullable(),
});

export const guestPartiesSchema = z.object({
  parties: z.array(guestPartySchema).min(2).max(6),
});

export type GuestAnswersInput = z.infer<typeof guestAnswersSchema>;
export type GuestPartyInput = z.infer<typeof guestPartySchema>;
