"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getCurrentDayNumber } from "@/lib/date-utils";
import { computeStreakStats } from "@/features/submission/streak-utils";

const baseInput = z.object({
  targetUserId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

function revalidateAdminViews(targetUserId: string) {
  revalidatePath(`/admin/students/${targetUserId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/analytics");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${targetUserId}`);
  revalidatePath("/challenge");
  revalidatePath("/quiz");
  revalidatePath("/register");
}

export async function resetProgressAction(input: {
  targetUserId: string;
  reason?: string;
}) {
  const admin = await requireAdmin();
  const parsed = baseInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid input" };

  const { targetUserId, reason } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { userId: targetUserId },
      });
      if (!enrollment) throw new Error("No enrollment");

      await tx.submission.deleteMany({
        where: { enrollmentId: enrollment.id },
      });

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          daysCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastSubmittedDay: null,
          status: "ACTIVE",
          completedAt: null,
          startedAt: new Date(),
        },
      });

      await tx.studentProfile.updateMany({
        where: { userId: targetUserId },
        data: { isReadyForInterview: false },
      });

      await tx.adminAction.create({
        data: {
          adminUserId: admin.userId,
          targetUserId,
          actionType: "RESET_PROGRESS",
          reason,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    revalidateAdminViews(targetUserId);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      message: e instanceof Error ? e.message : "Failed to reset progress",
    };
  }
}

export async function toggleReadyForInterviewAction(input: {
  targetUserId: string;
  reason?: string;
}) {
  const admin = await requireAdmin();
  const parsed = baseInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid input" };

  const { targetUserId, reason } = parsed.data;

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: targetUserId },
      select: { isReadyForInterview: true },
    });
    if (!profile) throw new Error("Profile not found");

    const newValue = !profile.isReadyForInterview;

    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.update({
        where: { userId: targetUserId },
        data: { isReadyForInterview: newValue },
      });

      await tx.adminAction.create({
        data: {
          adminUserId: admin.userId,
          targetUserId,
          actionType: "TOGGLE_READY_FOR_INTERVIEW",
          metadata: { newValue },
          reason,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    revalidateAdminViews(targetUserId);
    return { ok: true as const, newValue };
  } catch (e) {
    return {
      ok: false as const,
      message: e instanceof Error ? e.message : "Failed to toggle",
    };
  }
}

export async function removeFromChallengeAction(input: {
  targetUserId: string;
  reason?: string;
}) {
  const admin = await requireAdmin();
  const parsed = baseInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid input" };

  const { targetUserId, reason } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { userId: targetUserId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!enrollment) throw new Error("No active enrollment");

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "ABANDONED" },
      });

      await tx.adminAction.create({
        data: {
          adminUserId: admin.userId,
          targetUserId,
          actionType: "REMOVE_FROM_CHALLENGE",
          reason,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    revalidateAdminViews(targetUserId);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      message:
        e instanceof Error ? e.message : "Failed to remove from challenge",
    };
  }
}

export async function rejectSubmissionAction(input: {
  submissionId: string;
  reason?: string;
}) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      submissionId: z.string().min(1),
      reason: z.string().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid input" };

  const { submissionId, reason } = parsed.data;

  try {
    let targetUserId = "";

    await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        select: {
          id: true,
          userId: true,
          enrollmentId: true,
          dayNumber: true,
          githubUrl: true,
          enrollment: {
            select: {
              id: true,
              startedAt: true,
            },
          },
        },
      });
      if (!submission) throw new Error("Submission not found");

      targetUserId = submission.userId;

      await tx.submission.delete({ where: { id: submissionId } });

      const remainingCount = await tx.submission.count({
        where: { enrollmentId: submission.enrollmentId },
      });

      const lastSubmission = await tx.submission.findFirst({
        where: { enrollmentId: submission.enrollmentId },
        orderBy: { dayNumber: "desc" },
        select: { dayNumber: true },
      });

      await tx.enrollment.update({
        where: { id: submission.enrollmentId },
        data: {
          daysCompleted: remainingCount,
          lastSubmittedDay: lastSubmission?.dayNumber ?? null,
          status: remainingCount >= 60 ? "COMPLETED" : "ACTIVE",
          completedAt: remainingCount >= 60 ? new Date() : null,
        },
      });

      const { currentStreak, longestStreak } = await computeStreakStats(tx, {
        enrollmentId: submission.enrollmentId,
        endDay: getCurrentDayNumber(submission.enrollment.startedAt),
      });

      await tx.enrollment.update({
        where: { id: submission.enrollmentId },
        data: {
          currentStreak,
          longestStreak,
        },
      });

      await tx.adminAction.create({
        data: {
          adminUserId: admin.userId,
          targetUserId,
          actionType: "REJECT_SUBMISSION",
          metadata: {
            submissionId,
            dayNumber: submission.dayNumber,
            githubUrl: submission.githubUrl,
          },
          reason,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    revalidateAdminViews(targetUserId);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      message:
        e instanceof Error ? e.message : "Failed to reject submission",
    };
  }
}
