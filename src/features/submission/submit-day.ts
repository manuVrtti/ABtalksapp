import { EnrollmentStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentDayNumber } from "@/lib/date-utils";
import { normalizeGithubUrl, validateGithubUrl } from "./validate-github-url";
import { validateLinkedinUrl } from "./validate-linkedin-url";
import { computeStreakStats } from "./streak-utils";

export type SubmitDayOk = {
  ok: true;
  submissionId: string;
  newStreak: number;
  daysCompleted: number;
};

export type SubmitDayErr = {
  ok: false;
  reason: string;
  message: string;
};

export type SubmitDayResult = SubmitDayOk | SubmitDayErr;

export async function submitDay(input: {
  userId: string;
  githubUrl: string;
  linkedinUrl: string;
  dayNumber: number;
}): Promise<SubmitDayResult> {
  const { userId, linkedinUrl, dayNumber } = input;
  const githubNormalized = normalizeGithubUrl(input.githubUrl.trim());

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    orderBy: { startedAt: "desc" },
  });

  if (!enrollment) {
    return { ok: false, reason: "no_enrollment", message: "No active enrollment" };
  }

  const task = await prisma.dailyTask.findUnique({
    where: {
      challengeId_dayNumber: {
        challengeId: enrollment.challengeId,
        dayNumber,
      },
    },
    select: { id: true },
  });

  if (!task) {
    return { ok: false, reason: "day_not_found", message: "Day not found" };
  }

  const currentDay = getCurrentDayNumber(enrollment.startedAt);
  if (dayNumber > currentDay) {
    return {
      ok: false,
      reason: "locked",
      message: "This day is not yet unlocked",
    };
  }

  const gh = await validateGithubUrl(githubNormalized, userId, {
    enrollmentId: enrollment.id,
    dayNumber,
  });
  if (!gh.ok) {
    return { ok: false, reason: gh.reason, message: gh.message };
  }

  const li = validateLinkedinUrl(linkedinUrl);
  if (!li.ok) {
    return { ok: false, reason: li.reason, message: li.message };
  }

  const newStatus =
    dayNumber === currentDay ? SubmissionStatus.ON_TIME : SubmissionStatus.LATE;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.upsert({
        where: {
          enrollmentId_dayNumber: {
            enrollmentId: enrollment.id,
            dayNumber,
          },
        },
        create: {
          userId,
          enrollmentId: enrollment.id,
          dailyTaskId: task.id,
          dayNumber,
          githubUrl: githubNormalized,
          linkedinUrl: linkedinUrl.trim(),
          status: newStatus,
          submittedAt: new Date(),
        },
        update: {
          githubUrl: githubNormalized,
          linkedinUrl: linkedinUrl.trim(),
          status: newStatus,
          submittedAt: new Date(),
        },
      });

      const daysCompleted = await tx.submission.count({
        where: { enrollmentId: enrollment.id },
      });

      const { currentStreak: newStreak, longestStreak: recomputedLongest } =
        await computeStreakStats(
        tx,
        {
          enrollmentId: enrollment.id,
          endDay: currentDay,
        },
      );
      const completed = daysCompleted >= 60;

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          daysCompleted,
          currentStreak: newStreak,
          longestStreak: recomputedLongest,
          lastSubmittedDay: Math.max(enrollment.lastSubmittedDay ?? 0, dayNumber),
          ...(completed
            ? {
                status: EnrollmentStatus.COMPLETED,
                completedAt: new Date(),
              }
            : {}),
        },
      });

      if (completed) {
        await tx.studentProfile.updateMany({
          where: { userId },
          data: { isReadyForInterview: true },
        });
      }

      if (dayNumber >= 7) {
        await tx.referral.updateMany({
          where: { referredId: userId, rewardGiven: false },
          data: { rewardGiven: true },
        });
      }

      return {
        submissionId: submission.id,
        newStreak,
        daysCompleted,
      };
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return { ok: true, ...result };
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2002") {
      return {
        ok: false,
        reason: "duplicate",
        message: "This URL has been submitted by another student",
      };
    }
    throw e;
  }
}
