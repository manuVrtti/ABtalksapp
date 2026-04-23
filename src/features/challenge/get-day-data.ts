import type { DailyTask, Domain, SubmissionStatus } from "@prisma/client";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentDayNumber } from "@/lib/date-utils";

export type DayData = {
  task: DailyTask;
  existingSubmission: {
    githubUrl: string;
    linkedinUrl: string;
    status: SubmissionStatus;
    submittedAt: Date;
  } | null;
  currentDayNumber: number;
  isUnlocked: boolean;
  enrollment: { domain: Domain };
};

export async function getDayData(
  userId: string,
  dayNumber: number,
): Promise<DayData | null> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      challengeId: true,
      domain: true,
      startedAt: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  const task = await prisma.dailyTask.findUnique({
    where: {
      challengeId_dayNumber: {
        challengeId: enrollment.challengeId,
        dayNumber,
      },
    },
  });

  if (!task) {
    return null;
  }

  const submission = await prisma.submission.findUnique({
    where: {
      enrollmentId_dayNumber: {
        enrollmentId: enrollment.id,
        dayNumber,
      },
    },
    select: {
      githubUrl: true,
      linkedinUrl: true,
      status: true,
      submittedAt: true,
    },
  });

  const currentDayNumber = getCurrentDayNumber(enrollment.startedAt);
  const isUnlocked = dayNumber <= currentDayNumber;

  return {
    task,
    existingSubmission: submission,
    currentDayNumber,
    isUnlocked,
    enrollment: { domain: enrollment.domain },
  };
}
