"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { getCurrentDayNumber } from "@/lib/date-utils";
import {
  checkClaudeCommitDuplicate,
  getGithubUrlType,
  validateSubmissionUrl,
} from "@/lib/validations/submission";
import {
  assertPastDaySubmittable,
  submitDay,
} from "@/features/submission/submit-day";
import { resolveChallengeEnrollment } from "@/features/enrollment/resolve-dashboard-enrollment";

const submitSchema = z.object({
  githubUrl: z.string().optional().default(""),
  linkedinUrl: z.string().optional().default(""),
  dayNumber: z.coerce.number().int().min(1).max(60),
  confirmed: z
    .union([z.literal("true"), z.literal("on"), z.literal(true)])
    .optional()
    .transform((v) => v === "true" || v === "on" || v === true),
});

export async function submitDayAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, message: "You must be signed in." };
  }

  const parsed = submitSchema.safeParse({
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    dayNumber: formData.get("dayNumber"),
    confirmed: formData.get("confirmed"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  if (!parsed.data.confirmed) {
    return {
      ok: false as const,
      message: "Please confirm you've completed the task.",
    };
  }

  const userId = session.user.id;
  const { githubUrl, linkedinUrl, dayNumber } = parsed.data;

  const enrollmentIdRaw = formData.get("enrollmentId");
  const enrollmentId =
    typeof enrollmentIdRaw === "string" && enrollmentIdRaw.trim() !== ""
      ? enrollmentIdRaw.trim()
      : undefined;

  const enrollment = await resolveChallengeEnrollment(userId, enrollmentId);

  if (!enrollment) {
    return { ok: false as const, message: "No active enrollment" };
  }

  const currentDay = getCurrentDayNumber(enrollment, enrollment.challenge);
  if (dayNumber > currentDay) {
    return { ok: false as const, message: "This day is not yet unlocked" };
  }

  const pastCheck = await assertPastDaySubmittable(
    enrollment,
    dayNumber,
    enrollment.challenge,
  );
  if (!pastCheck.ok) {
    return { ok: false as const, message: pastCheck.message };
  }

  if (githubUrl.trim()) {
    if (enrollment.domain === "CLAUDE") {
      const urlType = getGithubUrlType(githubUrl.trim());

      if (urlType === "commit") {
        const duplicate = await checkClaudeCommitDuplicate(
          githubUrl.trim(),
          enrollment.id,
          dayNumber,
        );
        if (!duplicate.ok) {
          return { ok: false as const, message: duplicate.message };
        }
      }
    }

    const ghCheck = await validateSubmissionUrl(
      githubUrl.trim(),
      enrollment.domain,
      userId,
      { enrollmentId: enrollment.id, dayNumber },
    );
    if (!ghCheck.ok) {
      return { ok: false as const, message: ghCheck.message };
    }
  }

  return submitDay({
    userId,
    githubUrl,
    linkedinUrl,
    dayNumber,
    enrollmentId,
  });
}
