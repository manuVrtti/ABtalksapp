import { Domain, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getSubmissionsFeed(input: {
  domain?: string;
  status?: "ALL" | "ON_TIME" | "LATE";
}): Promise<
  Array<{
    id: string;
    userId: string;
    studentName: string;
    domain: string;
    dayNumber: number;
    status: string;
    githubUrl: string;
    linkedinUrl: string;
    submittedAt: Date;
  }>
> {
  const domainFilter =
    input.domain && input.domain !== "ALL" ? (input.domain as Domain) : undefined;
  const statusFilter =
    input.status && input.status !== "ALL"
      ? (input.status as SubmissionStatus)
      : undefined;

  const rows = await prisma.submission.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(domainFilter
        ? {
            enrollment: {
              domain: domainFilter,
            },
          }
        : {}),
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
    include: {
      enrollment: { select: { domain: true } },
      user: {
        select: {
          id: true,
          email: true,
          studentProfile: { select: { fullName: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.user.id,
    studentName:
      row.user.studentProfile?.fullName?.trim() || row.user.email || "Unknown",
    domain: row.enrollment.domain,
    dayNumber: row.dayNumber,
    status: row.status,
    githubUrl: row.githubUrl,
    linkedinUrl: row.linkedinUrl,
    submittedAt: row.submittedAt,
  }));
}
