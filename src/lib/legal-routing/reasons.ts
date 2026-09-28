import { ROUTE_REASON } from "./types";

/** Explanation text attached to every reason code (§39: controlled language). */
const REASON_TEXT: Record<string, string> = {
  [ROUTE_REASON.jurisdictionUnsupported]: "Aucune règle vérifiée n'est configurée pour cette juridiction.",
  [ROUTE_REASON.contractTypeUnknown]: "Le type de document n'a pas pu être identifié à partir de la demande.",
  [ROUTE_REASON.contractTypeNotOffered]: "Ce type de dossier n'est pas proposé en ligne par la plateforme.",
  [ROUTE_REASON.noVerifiedRule]:
    "Aucune règle vérifiée pour ce type de document : le parcours ne peut pas être déterminé automatiquement.",
  [ROUTE_REASON.rulesPendingVerification]:
    "Les règles existantes pour ce dossier ne sont pas encore vérifiées et ne peuvent pas être appliquées.",
  [ROUTE_REASON.selfService]: "Les règles configurées permettent une préparation autonome.",
  [ROUTE_REASON.lawyerOptional]: "La revue par un avocat est prévue comme facultative pour ce dossier.",
  [ROUTE_REASON.lawyerRequired]: "La revue par un avocat est prévue comme requise pour ce dossier.",
  [ROUTE_REASON.lawyerSignatureRequired]:
    "La signature de l'avocat est requise par une règle configurée pour ce dossier.",
  [ROUTE_REASON.specialistRequired]:
    "Ce dossier relève d'un professionnel spécialisé qui n'est pas couvert par la plateforme.",
  [ROUTE_REASON.legalRequirementApplied]: "Une exigence légale vérifiée s'applique à ce dossier.",
  [ROUTE_REASON.writtenContractRequired]: "Un contrat écrit est requis pour ce dossier.",
  [ROUTE_REASON.manualReviewRequired]: "Un examen manuel est requis avant de poursuivre.",
};

export function explainReasonCode(code: string): string {
  return REASON_TEXT[code] ?? code;
}

/** Audit sentence stored with the decision (the client-facing text is localised
 *  in the UI from the same reason codes). */
export function buildReason(reasonCodes: string[], matchedCount: number, gaps: string[]): string {
  const parts = reasonCodes.map(explainReasonCode);
  if (matchedCount > 0) parts.unshift(`Décision prise à partir de ${matchedCount} règle(s) vérifiée(s).`);
  if (gaps.length > 0) parts.push(`Éléments non appliqués : ${gaps.join(" | ")}`);
  return parts.join(" ");
}
