import { prisma } from "@/lib/db";

export async function getJobApplicants(jobId: string) {
  return prisma.jobApplication.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      note: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          studentProfile: {
            select: {
              fullName: true,
              phone: true,
              domain: true,
              linkedinUrl: true,
              githubUsername: true,
              college: true,
              graduationYear: true,
              isReadyForInterview: true,
            },
          },
        },
      },
    },
  });
}
