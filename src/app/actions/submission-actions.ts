"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentDayNumber } from "@/lib/date-utils";
import { EnrollmentStatus } from "@prisma/client";
import { normalizeGithubUrl, validateGithubUrl } from "@/features/submission/validate-github-url";
import {
  assertPastDaySubmittable,
  submitDay,
} from "@/features/submission/submit-day";

const githubStepSchema = z.object({
  githubUrl: z.string().min(1, "GitHub URL is required"),
  dayNumber: z.coerce.number().int().min(1).max(60),
});

const linkedinStepSchema = z.object({
  githubUrl: z.string().min(1),
  linkedinUrl: z.string().min(1, "LinkedIn URL is required"),
  dayNumber: z.coerce.number().int().min(1).max(60),
});

export type GithubStepResult =
  | {
      ok: true;
      linkedinTemplate: string;
      githubUrl: string;
      dayNumber: number;
    }
  | { ok: false; message: string };

export async function submitGithubStepAction(
  formData: FormData,
): Promise<GithubStepResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const parsed = githubStepSchema.safeParse({
    githubUrl: formData.get("githubUrl"),
    dayNumber: formData.get("dayNumber"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const userId = session.user.id;
  const { githubUrl, dayNumber } = parsed.data;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    orderBy: { startedAt: "desc" },
    select: { id: true, userId: true, challengeId: true, startedAt: true },
  });

  if (!enrollment) {
    return { ok: false, message: "No active enrollment" };
  }

  const currentDay = getCurrentDayNumber(enrollment.startedAt);
  if (dayNumber > currentDay) {
    return { ok: false, message: "This day is not yet unlocked" };
  }

  const pastCheck = await assertPastDaySubmittable(enrollment, dayNumber);
  if (!pastCheck.ok) {
    return { ok: false, message: pastCheck.message };
  }

  const task = await prisma.dailyTask.findUnique({
    where: {
      challengeId_dayNumber: {
        challengeId: enrollment.challengeId,
        dayNumber,
      },
    },
    select: { linkedinTemplate: true },
  });

  if (!task) {
    return { ok: false, message: "Day not found" };
  }

  const ghCheck = await validateGithubUrl(githubUrl.trim(), userId);
  if (!ghCheck.ok) {
    return { ok: false, message: ghCheck.message };
  }

  const normalized = normalizeGithubUrl(githubUrl.trim());
  const linkedinTemplate = task.linkedinTemplate.replaceAll(
    "{{github_link}}",
    normalized,
  );

  return {
    ok: true,
    linkedinTemplate,
    githubUrl: normalized,
    dayNumber,
  };
}

export async function submitLinkedinStepAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, reason: "auth", message: "You must be signed in." };
  }

  const parsed = linkedinStepSchema.safeParse({
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    dayNumber: formData.get("dayNumber"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      reason: "validation",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  return submitDay({
    userId: session.user.id,
    githubUrl: parsed.data.githubUrl,
    linkedinUrl: parsed.data.linkedinUrl,
    dayNumber: parsed.data.dayNumber,
  });
}
