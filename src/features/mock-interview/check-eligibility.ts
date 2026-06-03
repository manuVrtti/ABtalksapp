import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type MockInterviewEligibility =
  | { status: "NO_ENROLLMENT" }
  | { status: "IN_PROGRESS"; daysCompleted: number; totalDays: number }
  | { status: "MISSED_DAYS"; daysCompleted: number; missed: number }
  | { status: "ELIGIBLE"; completedAt: Date };

const STATUS_PRIORITY: Record<
  MockInterviewEligibility["status"],
  number
> = {
  ELIGIBLE: 4,
  IN_PROGRESS: 3,
  MISSED_DAYS: 2,
  NO_ENROLLMENT: 1,
};

async function evaluateEnrollment(enrollment: {
  id: string;
  status: EnrollmentStatus;
  daysCompleted: number;
  completedAt: Date | null;
  challenge: { totalDays: number };
}): Promise<MockInterviewEligibility> {
  const totalDays = enrollment.challenge.totalDays;

  if (enrollment.status !== EnrollmentStatus.COMPLETED) {
    return {
      status: "IN_PROGRESS",
      daysCompleted: enrollment.daysCompleted,
      totalDays,
    };
  }

  const agg = await prisma.submission.aggregate({
    where: { enrollmentId: enrollment.id },
    _max: { dayNumber: true },
    _count: { _all: true },
  });

  const maxDay = agg._max.dayNumber;
  const count = agg._count._all;

  if (maxDay === totalDays && count === totalDays) {
    return {
      status: "ELIGIBLE",
      completedAt: enrollment.completedAt ?? new Date(),
    };
  }

  const missed = (maxDay ?? 0) - count;
  return {
    status: "MISSED_DAYS",
    daysCompleted: enrollment.daysCompleted,
    missed,
  };
}

function pickBest(
  results: MockInterviewEligibility[],
): MockInterviewEligibility {
  if (results.length === 0) {
    return { status: "NO_ENROLLMENT" };
  }

  return results.reduce((best, current) => {
    if (
      STATUS_PRIORITY[current.status] > STATUS_PRIORITY[best.status]
    ) {
      return current;
    }
    if (
      current.status === "IN_PROGRESS" &&
      best.status === "IN_PROGRESS" &&
      current.daysCompleted > best.daysCompleted
    ) {
      return current;
    }
    return best;
  });
}

export async function getMockInterviewEligibility(
  userId: string,
): Promise<MockInterviewEligibility> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: {
          in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
        },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        daysCompleted: true,
        completedAt: true,
        challenge: { select: { totalDays: true } },
      },
    });

    if (enrollments.length === 0) {
      return { status: "NO_ENROLLMENT" };
    }

    const results = await Promise.all(
      enrollments.map((e) => evaluateEnrollment(e)),
    );

    return pickBest(results);
  } catch {
    return { status: "NO_ENROLLMENT" };
  }
}
