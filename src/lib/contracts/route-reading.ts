import type { RoutingRoute } from "@prisma/client";

/**
 * Pure route reading — shared by the catalogue (server) and the tests.
 *
 * Whether the VERIFIED routing rules of a contract type can ever allow a
 * self-service completion. Drives honest wording on the product page:
 * mandatory when nothing else is reachable, conditional when a lawyer is
 * required only for some situations, never required otherwise.
 */
export function lawyerRequirementForType(routes: RoutingRoute[]): "mandatory" | "conditional" | "no" {
  const reachable = routes.filter((route) => route !== "UNSUPPORTED" && route !== "ROUTING_UNDETERMINED");
  if (reachable.length === 0) return "no";
  const alwaysLawyer = reachable.every(
    (route) => route === "LAWYER_REQUIRED" || route === "LAWYER_SIGNATURE_REQUIRED" || route === "SPECIALIST_REQUIRED",
  );
  if (alwaysLawyer) return "mandatory";
  return "conditional";
}
