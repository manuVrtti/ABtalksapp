"use server";

import { Domain } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  getAnalyticsData,
  type TimeRange,
} from "@/features/admin/get-analytics-data";

export async function getStudentsForExport(filters: {
  domain?: Domain | "ALL";
  search?: string;
}) {
  await requireAdmin();

  const q = filters.search?.trim();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...(filters.domain && filters.domain !== "ALL"
        ? { domain: filters.domain }
        : {}),
      ...(q
        ? {
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
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
    select: {
      id: true,
      domain: true,
      status: true,
      startedAt: true,
      daysCompleted: true,
      currentStreak: true,
      longestStreak: true,
      user: {
        select: {
          email: true,
          name: true,
          studentProfile: {
            select: {
              fullName: true,
              phone: true,
              userType: true,
              college: true,
              graduationYear: true,
              organization: true,
              role: true,
              yearsExperience: true,
              linkedinUrl: true,
              githubUsername: true,
              isReadyForInterview: true,
              referralCode: true,
            },
          },
        },
      },
    },
    orderBy: [{ lastSubmittedDay: "desc" }, { createdAt: "desc" }],
  });

  return enrollments.map((e) => ({
    "Full Name": e.user.studentProfile?.fullName ?? e.user.name ?? "",
    Email: e.user.email,
    Phone: e.user.studentProfile?.phone ?? "",
    "User Type": e.user.studentProfile?.userType ?? "",
    Domain: e.domain,
    Status: e.status,
    "Started At": e.startedAt.toISOString().split("T")[0],
    "Days Completed": e.daysCompleted,
    "Current Streak": e.currentStreak,
    "Longest Streak": e.longestStreak,
    College: e.user.studentProfile?.college ?? "",
    "Graduation Year": e.user.studentProfile?.graduationYear ?? "",
    Organization: e.user.studentProfile?.organization ?? "",
    Role: e.user.studentProfile?.role ?? "",
    "Years Experience": e.user.studentProfile?.yearsExperience ?? "",
    LinkedIn: e.user.studentProfile?.linkedinUrl ?? "",
    GitHub: e.user.studentProfile?.githubUsername ?? "",
    "Ready For Interview": e.user.studentProfile?.isReadyForInterview ?? false,
    "Referral Code": e.user.studentProfile?.referralCode ?? "",
  }));
}

export async function getAnalyticsForExport(range: TimeRange = "daily") {
  await requireAdmin();

  const data = await getAnalyticsData(range);
  const rows: Record<string, string | number>[] = [];

  for (const row of data.domainDistribution) {
    rows.push({
      Section: "Domain Distribution",
      Label: row.name,
      Count: row.value,
    });
  }

  for (const row of data.registrationsSeries) {
    rows.push({
      Section: "Registrations",
      Label: row.label,
      Count: row.count,
    });
  }

  for (const row of data.submissionsSeries) {
    rows.push({
      Section: "Submissions",
      Label: row.label,
      Count: row.count,
    });
  }

  for (const row of data.dropOff) {
    rows.push({
      Section: "Drop-off",
      Label: row.milestone,
      Count: row.count,
    });
  }

  for (const row of data.submissionsByHour) {
    rows.push({
      Section: "Submissions by Hour (IST)",
      Label: row.hour,
      Count: row.count,
    });
  }

  for (const row of data.topPerformers) {
    rows.push({
      Section: "Top Performers",
      Label: row.name,
      Domain: row.domain,
      "Days Completed": row.daysCompleted,
      "Current Streak": row.currentStreak,
    });
  }

  const byDomainStatus = await prisma.enrollment.groupBy({
    by: ["domain", "status"],
    _count: true,
  });

  for (const row of byDomainStatus) {
    rows.push({
      Section: "Enrollments by Domain and Status",
      Domain: row.domain,
      Status: row.status,
      Count: row._count,
    });
  }

  return rows;
}
