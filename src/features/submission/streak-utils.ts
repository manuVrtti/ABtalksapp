import type { Prisma } from "@prisma/client";

export async function computeStreakStats(
  tx: Prisma.TransactionClient,
  input: {
    enrollmentId: string;
    endDay: number;
  },
): Promise<{ currentStreak: number; longestStreak: number }> {
  const endDay = Math.max(1, Math.min(input.endDay, 60));
  const submissions = await tx.submission.findMany({
    where: { enrollmentId: input.enrollmentId, dayNumber: { gte: 1, lte: endDay } },
    select: { dayNumber: true },
  });
  const hasSubmission = new Set<number>(submissions.map((s) => s.dayNumber));

  let currentStreak = 0;
  for (let day = endDay; day >= 1; day--) {
    if (hasSubmission.has(day)) {
      currentStreak += 1;
      continue;
    }
    break;
  }

  let longestStreak = 0;
  let running = 0;
  for (let day = 1; day <= endDay; day++) {
    if (hasSubmission.has(day)) {
      running += 1;
      if (running > longestStreak) longestStreak = running;
      continue;
    }
    running = 0;
  }

  return { currentStreak, longestStreak };
}
