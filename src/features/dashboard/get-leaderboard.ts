import { Domain } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LeaderboardRow = {
  rank: number;
  enrollmentId: string;
  userId: string;
  fullName: string;
  college: string;
  domain: Domain;
  daysCompleted: number;
  currentStreak: number;
  longestStreak: number;
  isReadyForInterview: boolean;
  isViewer: boolean;
};

export type LeaderboardResult = {
  rows: LeaderboardRow[];
  totalCount: number;
};

export async function getLeaderboard(
  input: {
    domain?: "AI" | "DS" | "SE" | "CLAUDE" | "ALL";
    search?: string;
    limit?: number;
    viewerUserId?: string;
    /** When false and domain is ALL, CLAUDE rows are hidden (feature flag off). */
    claudeLeaderboardEnabled?: boolean;
  },
): Promise<LeaderboardResult> {
  const domain = input.domain ?? "ALL";
  const search = input.search?.trim() ?? "";
  const limit = Math.max(1, Math.min(input.limit ?? 100, 200));

  const claudeLeaderboardEnabled = input.claudeLeaderboardEnabled ?? true;
  const hideClaudeFromAll = !claudeLeaderboardEnabled && domain === "ALL";

  const where = {
    status: { not: "ABANDONED" as const },
    ...(hideClaudeFromAll ? { domain: { not: Domain.CLAUDE } } : {}),
    ...(domain !== "ALL" ? { domain } : {}),
    ...(search
      ? {
          user: {
            studentProfile: {
              fullName: { contains: search, mode: "insensitive" as const },
            },
          },
        }
      : {}),
  };

  const [enrollments, totalCount] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      orderBy: [
        { daysCompleted: "desc" },
        { currentStreak: "desc" },
        { longestStreak: "desc" },
        { startedAt: "asc" },
      ],
      take: limit,
      select: {
        id: true,
        userId: true,
        domain: true,
        daysCompleted: true,
        currentStreak: true,
        longestStreak: true,
        user: {
          select: {
            studentProfile: {
              select: {
                fullName: true,
                college: true,
                isReadyForInterview: true,
              },
            },
          },
        },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  const rows: LeaderboardRow[] = enrollments
    .filter((e) => !!e.user.studentProfile)
    .map((e, index) => ({
      rank: index + 1,
      enrollmentId: e.id,
      userId: e.userId,
      fullName: e.user.studentProfile?.fullName ?? "Unknown",
      college: e.user.studentProfile?.college || "Unknown",
      domain: e.domain,
      daysCompleted: e.daysCompleted,
      currentStreak: e.currentStreak,
      longestStreak: e.longestStreak,
      isReadyForInterview: e.user.studentProfile?.isReadyForInterview ?? false,
      isViewer: e.userId === input.viewerUserId,
    }));

  return { rows, totalCount };
}
