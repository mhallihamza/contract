/**
 * Verification tier (§8b) — pure, dependency-free so it can run on the server
 * (reading ?tier= in a Server Component) and in the client bundle alike.
 */

export type VerifyTier = "ASSISTED" | "LAWYER";

/** Narrow marketing tier → tier key. Unknown values are ignored, never applied. */
export function verifyTierFromQuery(value: string | undefined): VerifyTier | null {
  return value === "assistee" ? "ASSISTED" : null;
}