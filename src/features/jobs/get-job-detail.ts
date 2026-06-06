import { prisma } from "@/lib/db";

export async function getJobDetail(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      type: true,
      description: true,
      applyExternalUrl: true,
      isOpen: true,
      createdAt: true,
    },
  });
  if (!job) return null;

  const applied = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId, userId } },
    select: { id: true },
  });

  return { job, alreadyApplied: !!applied };
}
