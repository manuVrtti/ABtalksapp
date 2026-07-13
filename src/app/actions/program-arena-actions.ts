"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { normalizeOutput } from "@/features/program/verify-mission";
import { isCohortFrozen } from "@/features/program/progression";
import { arenaCompleteSchema } from "@/lib/validations/program";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeArenaExerciseAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Please sign in to continue." };
  }

  const parsed = arenaCompleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid submission." };

  const cohort = await prisma.programCohort.findFirst({
    where: { status: { in: ["ENROLLING", "ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!cohort) return { ok: false, message: "Program unavailable." };

  const member = await prisma.programMember.findUnique({
    where: {
      userId_cohortId: { userId: session.user.id, cohortId: cohort.id },
    },
    select: {
      id: true,
      highestUnlockedDay: true,
      status: true,
      cohort: { select: { endsAt: true } },
    },
  });
  if (!member || (member.status !== "ENROLLED" && member.status !== "COMPLETED")) {
    return { ok: false, message: "Enrollment required." };
  }
  if (isCohortFrozen(member.cohort)) {
    return { ok: false, message: "This cohort has ended." };
  }

  const exercise = await prisma.programExercise.findUnique({
    where: { id: parsed.data.exerciseId },
    select: { id: true, moduleNumber: true, expectedOutput: true },
  });
  if (!exercise?.expectedOutput) {
    return { ok: false, message: "Exercise not found." };
  }

  const day = await prisma.programDay.findUnique({
    where: { dayNumber: member.highestUnlockedDay },
    select: { module: { select: { number: true } } },
  });
  const currentModule = day?.module.number ?? 1;
  if (exercise.moduleNumber > currentModule) {
    return { ok: false, message: "This exercise is locked." };
  }

  const existing = await prisma.programExerciseCompletion.findUnique({
    where: {
      memberId_exerciseId: {
        memberId: member.id,
        exerciseId: exercise.id,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, message: "You already completed this exercise." };
  }

  if (normalizeOutput(parsed.data.output) !== normalizeOutput(exercise.expectedOutput)) {
    return { ok: false, message: "Output does not match the expected result." };
  }

  await prisma.programExerciseCompletion.create({
    data: {
      memberId: member.id,
      exerciseId: exercise.id,
      code: parsed.data.code,
    },
  });

  revalidatePath("/program/arena");
  return { ok: true };
}
