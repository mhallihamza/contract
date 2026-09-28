import type { Language } from "@prisma/client";

/**
 * Lawyer assignment — pure selection logic (§19).
 *
 * There is no marketplace and no client-side choice. Selection is deterministic
 * (no randomness) so the same platform state always produces the same
 * assignment and the decision is reproducible in tests.
 */
export interface AssignmentCandidate {
  lawyerId: string;
  userId: string;
  fullName: string;
  email: string;
  specializations: string[];
  languages: Language[];
  jurisdictions: string[];
  maxConcurrentCases: number;
  currentWorkload: number;
  active: boolean;
  score: number;
  scoreDetails: Record<string, number>;
}

export interface AssignmentOutcome {
  assigned: boolean;
  candidate: AssignmentCandidate | null;
  reason: string;
  consideredCandidates: AssignmentCandidate[];
  failureReason?: "NO_ACTIVE_LAWYER" | "ALL_AT_CAPACITY" | "NO_SPECIALISATION_MATCH";
}

export interface AssignmentRequest {
  contractId: string;
  lawyerRequestId: string;
  /** e.g. RENTAL, SERVICES, CONFIDENTIALITY — matched against specialisations. */
  specializationHint: string | null;
  requiredLanguages: Language[];
  jurisdiction: string;
  /** Lawyers already tried (declined / reassigned) — excluded from selection. */
  excludeLawyerIds?: string[];
  actorId?: string | null;
}

export const ASSIGNMENT_WEIGHTS = {
  specialization: 40,
  language: 20,
  jurisdiction: 10,
  capacity: 30,
} as const;

export function scoreCandidate(
  candidate: AssignmentCandidate,
  request: AssignmentRequest,
): AssignmentCandidate {
  const specializationMatch = request.specializationHint
    ? candidate.specializations.some(
        (specialization) => specialization.toUpperCase() === request.specializationHint!.toUpperCase(),
      )
    : candidate.specializations.length > 0;
  const languageMatches = candidate.languages.filter((language) =>
    request.requiredLanguages.includes(language),
  ).length;
  const capacityFree = Math.max(0, candidate.maxConcurrentCases - candidate.currentWorkload);
  const jurisdictionMatch = candidate.jurisdictions.includes(request.jurisdiction);

  const scoreDetails: Record<string, number> = {
    specialization: specializationMatch ? ASSIGNMENT_WEIGHTS.specialization : 0,
    language: Math.min(ASSIGNMENT_WEIGHTS.language, languageMatches * ASSIGNMENT_WEIGHTS.language),
    jurisdiction: jurisdictionMatch ? ASSIGNMENT_WEIGHTS.jurisdiction : 0,
    capacity: Math.min(ASSIGNMENT_WEIGHTS.capacity, capacityFree * 3),
  };

  return {
    ...candidate,
    score: Object.values(scoreDetails).reduce((total, value) => total + value, 0),
    scoreDetails,
  };
}

export function selectLawyer(candidates: AssignmentCandidate[], request: AssignmentRequest): AssignmentOutcome {
  const excluded = new Set(request.excludeLawyerIds ?? []);
  const pool = candidates.filter((candidate) => !excluded.has(candidate.userId) && candidate.active);

  if (pool.length === 0) {
    return {
      assigned: false,
      candidate: null,
      reason: "Aucun avocat actif disponible pour ce dossier.",
      consideredCandidates: [],
      failureReason: "NO_ACTIVE_LAWYER",
    };
  }

  const withCapacity = pool.filter((candidate) => candidate.currentWorkload < candidate.maxConcurrentCases);
  if (withCapacity.length === 0) {
    return {
      assigned: false,
      candidate: null,
      reason: "Tous les avocats actifs ont atteint leur plafond de dossiers simultanés.",
      consideredCandidates: pool,
      failureReason: "ALL_AT_CAPACITY",
    };
  }

  const specializationMatches = request.specializationHint
    ? withCapacity.filter((candidate) =>
        candidate.specializations.some(
          (specialization) => specialization.toUpperCase() === request.specializationHint!.toUpperCase(),
        ),
      )
    : withCapacity;

  if (request.specializationHint && specializationMatches.length === 0) {
    return {
      assigned: false,
      candidate: null,
      reason: `Aucun avocat disponible avec la spécialisation « ${request.specializationHint} ».`,
      consideredCandidates: withCapacity,
      failureReason: "NO_SPECIALISATION_MATCH",
    };
  }

  const scored = specializationMatches
    .map((candidate) => scoreCandidate(candidate, request))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.currentWorkload - b.currentWorkload ||
        a.fullName.localeCompare(b.fullName),
    );

  const best = scored[0]!;
  const reason = [
    `Sélection déterministe (score ${best.score})`,
    `spécialisation:${best.scoreDetails.specialization ?? 0}`,
    `langues:${best.scoreDetails.language ?? 0}`,
    `juridiction:${best.scoreDetails.jurisdiction ?? 0}`,
    `capacité:${best.scoreDetails.capacity ?? 0}`,
    `charge ${best.currentWorkload}/${best.maxConcurrentCases}`,
  ].join(" · ");

  return { assigned: true, candidate: best, reason, consideredCandidates: scored };
}
