import { db } from "@/lib/db/prisma";
import { LOG_EVENTS, logger } from "@/lib/logging";
import {
  selectLawyer,
  type AssignmentCandidate,
  type AssignmentOutcome,
  type AssignmentRequest,
} from "./assignment-selection";

export type {
  AssignmentCandidate,
  AssignmentOutcome,
  AssignmentRequest,
} from "./assignment-selection";
export { selectLawyer } from "./assignment-selection";

/** Statuses that count as "work in progress" for workload purposes. */
export const ACTIVE_WORKLOAD_STATUSES = [
  "ASSIGNED",
  "UNDER_REVIEW",
  "INFORMATION_REQUESTED",
  "CHANGES_REQUESTED",
  "READY_FOR_VALIDATION",
  "SIGNATURE_PENDING",
] as const;

export async function loadAssignmentCandidates(): Promise<AssignmentCandidate[]> {
  const lawyers = await db.user.findMany({
    where: { role: "LAWYER", status: "ACTIVE", lawyerProfile: { is: { active: true } } },
    include: {
      lawyerProfile: true,
      _count: {
        select: { lawyerRequests: { where: { status: { in: [...ACTIVE_WORKLOAD_STATUSES] } } } },
      },
    },
  });

  return lawyers.map((lawyer) => {
    const profile = lawyer.lawyerProfile!;
    return {
      lawyerId: profile.id,
      userId: lawyer.id,
      fullName: lawyer.fullName,
      email: lawyer.email,
      specializations: profile.specializations,
      languages: profile.languages,
      jurisdictions: profile.jurisdictions,
      maxConcurrentCases: profile.maxConcurrentCases,
      currentWorkload: lawyer._count.lawyerRequests,
      active: profile.active,
      score: 0,
      scoreDetails: {},
    };
  });
}

/** Attempts an assignment; returns the outcome including the reason (§19). */
export async function assignLawyer(request: AssignmentRequest): Promise<AssignmentOutcome> {
  logger.info(LOG_EVENTS.assignmentAttempted, {
    contractId: request.contractId,
    lawyerRequestId: request.lawyerRequestId,
    specializationHint: request.specializationHint,
  });

  const candidates = await loadAssignmentCandidates();
  const outcome = selectLawyer(candidates, request);

  if (!outcome.assigned || !outcome.candidate) {
    logger.warn(LOG_EVENTS.assignmentFailed, { contractId: request.contractId, reason: outcome.failureReason });
    return outcome;
  }

  const candidate = outcome.candidate;

  await db.$transaction(async (tx) => {
    await tx.lawyerAssignment.create({
      data: {
        lawyerRequestId: request.lawyerRequestId,
        lawyerId: candidate.userId,
        assignedById: request.actorId ?? null,
        status: "ASSIGNED",
        assignmentReason: outcome.reason,
        scoreDetails: candidate.scoreDetails,
        workloadAtAssignment: candidate.currentWorkload,
        maxConcurrentAtAssignment: candidate.maxConcurrentCases,
      },
    });
    await tx.lawyerRequest.update({
      where: { id: request.lawyerRequestId },
      data: { lawyerId: candidate.userId, status: "ASSIGNED" },
    });
    await tx.contract.update({
      where: { id: request.contractId },
      data: { assignedLawyerId: candidate.userId },
    });
  });

  logger.info(LOG_EVENTS.assignmentSucceeded, {
    contractId: request.contractId,
    lawyerRequestId: request.lawyerRequestId,
    lawyerId: candidate.userId,
    score: candidate.score,
  });

  return outcome;
}

export async function lawyerWorkload(lawyerUserId: string): Promise<number> {
  return db.lawyerRequest.count({
    where: { lawyerId: lawyerUserId, status: { in: [...ACTIVE_WORKLOAD_STATUSES] } },
  });
}

/** Marks the current assignment as declined and immediately tries the next one. */
export async function declineAndReassign(params: {
  lawyerRequestId: string;
  lawyerUserId: string;
  reason: string;
}): Promise<AssignmentOutcome> {
  const request = await db.lawyerRequest.findUniqueOrThrow({
    where: { id: params.lawyerRequestId },
    include: { contract: { include: { contractType: true } }, assignments: true },
  });

  await db.$transaction(async (tx) => {
    await tx.lawyerAssignment.updateMany({
      where: { lawyerRequestId: params.lawyerRequestId, lawyerId: params.lawyerUserId, status: "ASSIGNED" },
      data: { status: "DECLINED", declineReason: params.reason, respondedAt: new Date() },
    });
    await tx.lawyerRequest.update({
      where: { id: params.lawyerRequestId },
      data: { status: "ASSIGNMENT_PENDING", lawyerId: null },
    });
    await tx.contract.update({
      where: { id: request.contractId },
      data: { assignedLawyerId: null },
    });
  });

  return assignLawyer({
    contractId: request.contractId,
    lawyerRequestId: params.lawyerRequestId,
    specializationHint: request.contract.contractType.category,
    requiredLanguages: [request.contract.language],
    jurisdiction: request.contract.jurisdiction,
    excludeLawyerIds: [...request.assignments.map((assignment) => assignment.lawyerId), params.lawyerUserId],
  });
}
