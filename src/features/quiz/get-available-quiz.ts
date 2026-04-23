import type { Prisma } from "@prisma/client";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type QuizAvailabilityReason =
  | "none_available"
  | "already_attempted"
  | "ready"
  | "not_yet_unlocked";

export type AvailableQuizPayload = {
  quiz: Prisma.QuizGetPayload<object> | null;
  reason: QuizAvailabilityReason;
  attempt: Prisma.QuizAttemptGetPayload<{ include: { quiz: true } }> | null;
};

/**
 * Week N unlocks when daysCompleted >= 7 * N (N = 1..8).
 * Offers the highest eligible week the user has not attempted, if a quiz exists in DB.
 */
export async function getAvailableQuiz(
  userId: string,
  enrollmentId: string,
): Promise<AvailableQuizPayload> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      userId,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    select: {
      challengeId: true,
      domain: true,
      daysCompleted: true,
    },
  });

  if (!enrollment) {
    return {
      quiz: null,
      reason: "none_available",
      attempt: null,
    };
  }

  const { challengeId, domain, daysCompleted } = enrollment;
  const maxEligibleWeek = Math.min(8, Math.floor(daysCompleted / 7));

  if (maxEligibleWeek < 1) {
    return {
      quiz: null,
      reason: "not_yet_unlocked",
      attempt: null,
    };
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      quiz: {
        challengeId,
        domain,
      },
    },
    include: {
      quiz: true,
    },
    orderBy: { attemptedAt: "desc" },
  });

  const attemptedWeeks = new Set(
    attempts.map((a) => a.quiz.weekNumber),
  );

  for (let week = maxEligibleWeek; week >= 1; week--) {
    if (daysCompleted < 7 * week) {
      continue;
    }
    if (attemptedWeeks.has(week)) {
      continue;
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        challengeId,
        domain,
        weekNumber: week,
      },
    });

    if (quiz) {
      return {
        quiz,
        reason: "ready",
        attempt: null,
      };
    }
  }

  const eligibleAttempts = attempts.filter(
    (a) => a.quiz.weekNumber <= maxEligibleWeek,
  );

  if (eligibleAttempts.length > 0) {
    return {
      quiz: null,
      reason: "already_attempted",
      attempt: eligibleAttempts[0]!,
    };
  }

  return {
    quiz: null,
    reason: "none_available",
    attempt: null,
  };
}
