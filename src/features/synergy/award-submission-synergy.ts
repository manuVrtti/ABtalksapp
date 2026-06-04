import type { Prisma } from "@prisma/client";
import { computeSubmissionSynergy } from "./scoring";

export async function awardSubmissionSynergy(
  tx: Prisma.TransactionClient,
  args: {
    userId: string;
    submissionId: string;
    enrollmentId: string;
    challengeId: string;
    dayNumber: number;
    submittedAt: Date;
    hasGithub: boolean;
    hasLinkedin: boolean;
  },
): Promise<number> {
  const earlier = await tx.submission.count({
    where: {
      dayNumber: args.dayNumber,
      enrollment: { challengeId: args.challengeId },
      submittedAt: { lt: args.submittedAt },
      id: { not: args.submissionId },
    },
  });
  const rank = earlier + 1;
  const { points } = computeSubmissionSynergy({
    rank,
    hasGithub: args.hasGithub,
    hasLinkedin: args.hasLinkedin,
  });

  await tx.synergyEvent.create({
    data: {
      userId: args.userId,
      points,
      type: "SUBMISSION",
      submissionId: args.submissionId,
      enrollmentId: args.enrollmentId,
      dayNumber: args.dayNumber,
      rankAtAward: rank,
    },
  });
  await tx.studentProfile.updateMany({
    where: { userId: args.userId },
    data: { synergyPoints: { increment: points } },
  });
  return points;
}
