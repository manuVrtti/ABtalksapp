import type { Domain } from "@prisma/client";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface UserEnrollmentSummary {
  id: string;
  domain: Domain;
  challengeTitle: string;
  daysCompleted: number;
  currentStreak: number;
}

export async function getUserActiveEnrollments(
  userId: string,
): Promise<UserEnrollmentSummary[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: EnrollmentStatus.ACTIVE },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      domain: true,
      daysCompleted: true,
      currentStreak: true,
      challenge: { select: { title: true } },
    },
  });

  return enrollments.map((e) => ({
    id: e.id,
    domain: e.domain,
    challengeTitle: e.challenge.title,
    daysCompleted: e.daysCompleted,
    currentStreak: e.currentStreak,
  }));
}
