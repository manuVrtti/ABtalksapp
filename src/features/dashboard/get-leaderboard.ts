import type { Domain } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  fullName: string;
  daysCompleted: number;
  currentStreak: number;
  isCurrentUser: boolean;
};

export type UserRankInfo = {
  rank: number;
  daysCompleted: number;
  currentStreak: number;
};

export type LeaderboardResult = {
  topTen: LeaderboardRow[];
  userRank: UserRankInfo | null;
};

export async function getLeaderboard(
  domain: Domain,
  currentUserId: string,
): Promise<LeaderboardResult> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      domain,
      status: { not: "ABANDONED" },
    },
    orderBy: [
      { daysCompleted: "desc" },
      { currentStreak: "desc" },
      { longestStreak: "desc" },
      { startedAt: "asc" },
    ],
    select: {
      userId: true,
      daysCompleted: true,
      currentStreak: true,
      longestStreak: true,
      user: {
        select: {
          id: true,
          name: true,
          studentProfile: { select: { fullName: true } },
        },
      },
    },
  });

  const rows: LeaderboardRow[] = enrollments.map((e, index) => ({
    rank: index + 1,
    userId: e.userId,
    fullName:
      e.user.studentProfile?.fullName ?? e.user.name ?? "Unknown",
    daysCompleted: e.daysCompleted,
    currentStreak: e.currentStreak,
    isCurrentUser: e.userId === currentUserId,
  }));

  const topTen = rows.slice(0, 10).map((r) => ({
    ...r,
    isCurrentUser: r.userId === currentUserId,
  }));

  const idx = rows.findIndex((r) => r.userId === currentUserId);
  const userInTopTen = idx !== -1 && idx < 10;

  let userRank: UserRankInfo | null = null;
  if (!userInTopTen && idx !== -1) {
    const r = rows[idx]!;
    userRank = {
      rank: r.rank,
      daysCompleted: r.daysCompleted,
      currentStreak: r.currentStreak,
    };
  }

  return { topTen, userRank };
}
