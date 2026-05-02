import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readDayNumberFromMetadata } from "@/lib/admin-action-metadata";
import { getIstDateKeyForChallengeDay, IST } from "@/lib/date-utils";
import { formatInTimeZone } from "date-fns-tz";

export type HeatmapCellStatus =
  | "on_time"
  | "late"
  | "future"
  | "missed"
  | "rejected";

export type HeatmapCell = {
  dayNumber: number;
  date: string;
  status: HeatmapCellStatus;
  /** Daily task metadata when the challenge defines this day */
  taskTitle: string | null;
  problemStatement: string | null;
  learningObjectives: string[];
  resources: string[];
  tags: string[];
  difficulty: string | null;
  estimatedMinutes: number | null;
  /** Submission fields when this day was submitted (on_time / late) */
  githubUrl: string | null;
  linkedinUrl: string | null;
  /** ISO timestamp for display */
  submittedAt: string | null;
  adminName: string | null;
  actionReason: string | null;
  actionAt: string | null;
};

export async function getHeatmapData(
  enrollmentId: string,
  options?: { includeSubmissionDetails?: boolean },
): Promise<HeatmapCell[]> {
  const includeSubmissionDetails = options?.includeSubmissionDetails ?? true;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { startedAt: true, challengeId: true, userId: true },
  });

  if (!enrollment) {
    return [];
  }

  const [submissions, tasks, adminActions] = await Promise.all([
    prisma.submission.findMany({
      where: { enrollmentId },
      select: {
        dayNumber: true,
        status: true,
        githubUrl: includeSubmissionDetails,
        linkedinUrl: includeSubmissionDetails,
        submittedAt: true,
      },
    }),
    prisma.dailyTask.findMany({
      where: {
        challengeId: enrollment.challengeId,
        dayNumber: { gte: 1, lte: 60 },
      },
      select: {
        dayNumber: true,
        title: true,
        problemStatement: true,
        learningObjectives: true,
        resources: true,
        tags: true,
        difficulty: true,
        estimatedMinutes: true,
      },
    }),
    prisma.adminAction.findMany({
      where: {
        targetUserId: enrollment.userId,
        actionType: "REJECT_SUBMISSION",
      },
      orderBy: { createdAt: "desc" },
      select: {
        actionType: true,
        metadata: true,
        reason: true,
        createdAt: true,
        admin: {
          select: {
            name: true,
            email: true,
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    }),
  ]);

  const byDay = new Map<
    number,
    {
      status: SubmissionStatus;
      githubUrl: string | null;
      linkedinUrl: string | null;
      submittedAt: Date;
    }
  >();
  for (const s of submissions) {
    byDay.set(s.dayNumber, {
      status: s.status,
      githubUrl: s.githubUrl ?? null,
      linkedinUrl: s.linkedinUrl ?? null,
      submittedAt: s.submittedAt,
    });
  }

  const taskByDay = new Map<
    number,
    {
      title: string;
      problemStatement: string;
      learningObjectives: string[];
      resources: string[];
      tags: string[];
      difficulty: string;
      estimatedMinutes: number;
    }
  >();
  for (const t of tasks) {
    taskByDay.set(t.dayNumber, {
      title: t.title,
      problemStatement: t.problemStatement,
      learningObjectives: t.learningObjectives ?? [],
      resources: t.resources ?? [],
      tags: t.tags ?? [],
      difficulty: t.difficulty,
      estimatedMinutes: t.estimatedMinutes,
    });
  }

  const rejectActionByDay = new Map<
    number,
    { reason: string | null; createdAt: Date; adminName: string }
  >();
  for (const action of adminActions) {
    const dayNumber = readDayNumberFromMetadata(action.metadata);
    if (!dayNumber || dayNumber < 1 || dayNumber > 60) continue;
    const adminName =
      action.admin.studentProfile?.fullName?.trim() ||
      action.admin.name?.trim() ||
      action.admin.email;
    if (!rejectActionByDay.has(dayNumber)) {
      rejectActionByDay.set(dayNumber, {
        reason: action.reason ?? null,
        createdAt: action.createdAt,
        adminName,
      });
    }
  }

  const nowKey = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
  const out: HeatmapCell[] = [];

  for (let dayNumber = 1; dayNumber <= 60; dayNumber++) {
    const date = getIstDateKeyForChallengeDay(enrollment.startedAt, dayNumber);
    const row = byDay.get(dayNumber);
    const task = taskByDay.get(dayNumber);

    let status: HeatmapCellStatus = "future";
    const rejectAction = rejectActionByDay.get(dayNumber);

    if (row) {
      status = row.status === SubmissionStatus.ON_TIME ? "on_time" : "late";
    } else if (rejectAction) {
      status = "rejected";
    } else if (date > nowKey) {
      status = "future";
    } else {
      status = "missed";
    }

    const hasSubmission = status === "on_time" || status === "late";
    const action = status === "rejected" ? rejectAction : null;

    out.push({
      dayNumber,
      date,
      status,
      taskTitle: task?.title ?? null,
      problemStatement: task?.problemStatement ?? null,
      learningObjectives: task?.learningObjectives ?? [],
      resources: task?.resources ?? [],
      tags: task?.tags ?? [],
      difficulty: task?.difficulty ?? null,
      estimatedMinutes: task?.estimatedMinutes ?? null,
      githubUrl:
        includeSubmissionDetails && hasSubmission && row ? row.githubUrl : null,
      linkedinUrl:
        includeSubmissionDetails && hasSubmission && row ? row.linkedinUrl : null,
      submittedAt:
        hasSubmission && row ? row.submittedAt.toISOString() : null,
      adminName: action?.adminName ?? null,
      actionReason: action?.reason ?? null,
      actionAt: action?.createdAt?.toISOString() ?? null,
    });
  }

  return out;
}
