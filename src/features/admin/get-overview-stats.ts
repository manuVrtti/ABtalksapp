import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";

function getIstDayBounds(now: Date = new Date()) {
  const istDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const start = new Date(`${istDay}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function formatAdminActionType(actionType: string): string {
  return actionType
    .toLowerCase()
    .split("_")
    .map((part, index) => {
      if (index === 0) return `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`;
      return part;
    })
    .join(" ");
}

export async function getOverviewStats() {
  const { start, end } = getIstDayBounds();

  const [
    totalStudents,
    activeToday,
    day7Reached,
    day30Reached,
    liveSubmissionsRaw,
    recentAdminActionsRaw,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.submission.findMany({
      where: { submittedAt: { gte: start, lt: end } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.enrollment.count({ where: { daysCompleted: { gte: 7 } } }),
    prisma.enrollment.count({ where: { daysCompleted: { gte: 30 } } }),
    prisma.submission.findMany({
      orderBy: { submittedAt: "desc" },
      take: 10,
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
    }),
    prisma.adminAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        admin: {
          select: {
            email: true,
            studentProfile: { select: { fullName: true } },
          },
        },
        target: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      totalStudents,
      activeToday: activeToday.length,
      day7Reached,
      day30Reached,
    },
    liveSubmissions: liveSubmissionsRaw.map((row) => ({
      id: row.id,
      userId: row.user.id,
      studentName:
        row.user.studentProfile?.fullName?.trim() || row.user.email || "Unknown",
      dayNumber: row.dayNumber,
      domain: row.enrollment.domain,
      linkedinUrl: row.linkedinUrl,
      submittedAt: row.submittedAt,
      submittedAtRelative: formatDistanceToNow(row.submittedAt, { addSuffix: true }),
    })),
    recentAdminActions: recentAdminActionsRaw.map((row) => ({
      id: row.id,
      adminName:
        row.admin.studentProfile?.fullName?.trim() || row.admin.email || "Admin",
      actionType: row.actionType,
      actionLabel: formatAdminActionType(row.actionType),
      targetUserId: row.target.id,
      targetName:
        row.target.studentProfile?.fullName?.trim() ||
        row.target.email ||
        "Unknown",
      createdAt: row.createdAt,
      createdAtRelative: formatDistanceToNow(row.createdAt, { addSuffix: true }),
    })),
  };
}
