import { Domain, EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type Input = {
  search?: string;
  domain?: "AI" | "DS" | "SE" | "ALL";
  status?: "ALL" | "ACTIVE" | "COMPLETED";
};

export async function getStudents(
  input: Input,
): Promise<
  Array<{
    userId: string;
    fullName: string;
    email: string;
    domain: string;
    daysCompleted: number;
    currentStreak: number;
    status: string;
    joinedAt: Date;
    isReadyForInterview: boolean;
  }>
> {
  const q = input.search?.trim();
  const domainFilter =
    input.domain && input.domain !== "ALL" ? (input.domain as Domain) : undefined;
  const statusFilter =
    input.status && input.status !== "ALL"
      ? (input.status as EnrollmentStatus)
      : undefined;

  const rows = await prisma.enrollment.findMany({
    where: {
      ...(domainFilter ? { domain: domainFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            user: {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                {
                  studentProfile: {
                    fullName: { contains: q, mode: "insensitive" },
                  },
                },
              ],
            },
          }
        : {}),
    },
    orderBy: [{ lastSubmittedDay: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true,
          studentProfile: {
            select: {
              fullName: true,
              domain: true,
              isReadyForInterview: true,
            },
          },
        },
      },
    },
  });

  return rows
    .filter((row) => !!row.user.studentProfile)
    .map((row) => ({
      userId: row.user.id,
      fullName: row.user.studentProfile?.fullName || row.user.email || "Unknown",
      email: row.user.email,
      domain: row.user.studentProfile?.domain || row.domain,
      daysCompleted: row.daysCompleted,
      currentStreak: row.currentStreak,
      status: row.status,
      joinedAt: row.user.createdAt,
      isReadyForInterview: row.user.studentProfile?.isReadyForInterview ?? false,
    }));
}
