import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

function formatIstDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getIstHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
}

export async function getAnalyticsData() {
  const now = new Date();
  const start30 = subDays(now, 29);

  const [
    recentProfiles,
    domainGrouped,
    allEnrollments,
    allSubmissions,
    topPerformersRaw,
  ] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { createdAt: { gte: start30 } },
      select: { createdAt: true },
    }),
    prisma.studentProfile.groupBy({
      by: ["domain"],
      _count: { domain: true },
    }),
    prisma.enrollment.findMany({
      select: { daysCompleted: true },
    }),
    prisma.submission.findMany({
      select: { submittedAt: true },
    }),
    prisma.enrollment.findMany({
      orderBy: [{ daysCompleted: "desc" }, { currentStreak: "desc" }],
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            studentProfile: {
              select: { fullName: true, domain: true },
            },
          },
        },
      },
    }),
  ]);

  const registrationsByDay = Array.from({ length: 30 }, (_, index) => {
    const day = subDays(now, 29 - index);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(day);

    const count = recentProfiles.filter((profile) => {
      const profileKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(profile.createdAt);
      return profileKey === key;
    }).length;

    return { label: formatIstDay(day), count };
  });

  const domainDistribution = ["AI", "DS", "SE"].map((domain) => ({
    name: domain,
    value: domainGrouped.find((row) => row.domain === domain)?._count.domain ?? 0,
  }));

  const milestones = [1, 7, 14, 30, 45, 60];
  const dropOff = milestones.map((milestone) => ({
    milestone: `Day ${milestone}`,
    count: allEnrollments.filter((row) => row.daysCompleted >= milestone).length,
  }));

  const submissionsByHourBuckets = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    count: 0,
  }));

  for (const submission of allSubmissions) {
    submissionsByHourBuckets[getIstHour(submission.submittedAt)]!.count += 1;
  }

  const topPerformers = topPerformersRaw.map((row) => ({
    name:
      row.user.studentProfile?.fullName?.trim() || row.user.email || "Unknown",
    domain: row.user.studentProfile?.domain || row.domain,
    daysCompleted: row.daysCompleted,
    currentStreak: row.currentStreak,
  }));

  return {
    registrationsByDay,
    domainDistribution,
    dropOff,
    submissionsByHour: submissionsByHourBuckets,
    topPerformers,
  };
}
