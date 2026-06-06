import { prisma } from "@/lib/db";

export async function getJobsAdmin() {
  return prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      type: true,
      isOpen: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });
}
