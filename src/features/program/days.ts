import "server-only";
import type { ProgramLanguage, ProgramMissionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type DayState = "LOCKED" | "AVAILABLE" | "PASSED" | "SKIPPED";

export type DayVideo = {
  id: string;
  order: number;
  title: string;
  youtubeId: string;
  durationMin: number | null;
};

// NOTE: missionSpec is deliberately excluded from every select in this file
// (roadmap §9.8 — it is server-only and must never reach the client).
export type DayShell = {
  id: string;
  dayNumber: number;
  title: string;
  missionType: ProgramMissionType;
  briefMd: string;
  assetsJson: Prisma.JsonValue | null;
  starterCode: string | null;
  language: ProgramLanguage | null;
  objectives: string[];
  tools: string[];
  estimatedMin: number;
  missionPoints: number;
  isProjectDay: boolean;
  module: { number: number; title: string; color: string };
  videos: DayVideo[];
};

export type DayShellResult = { day: DayShell; state: DayState };

export type CurriculumModule = {
  number: number;
  title: string;
  subtitle: string;
  color: string;
  startDay: number;
  endDay: number;
};

export type CurriculumDay = {
  dayNumber: number;
  title: string;
  missionType: ProgramMissionType;
  isProjectDay: boolean;
  moduleNumber: number;
  state: DayState;
};

function deriveState(
  dayNumber: number,
  highestUnlockedDay: number,
  passed: boolean,
): DayState {
  if (passed) return "PASSED";
  if (dayNumber <= highestUnlockedDay) return "AVAILABLE";
  return "LOCKED";
}

export async function getDayShell(
  memberId: string,
  dayNumber: number,
): Promise<DayShellResult | null> {
  const day = await prisma.programDay.findUnique({
    where: { dayNumber },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      missionType: true,
      briefMd: true,
      assetsJson: true,
      starterCode: true,
      language: true,
      objectives: true,
      tools: true,
      estimatedMin: true,
      missionPoints: true,
      isProjectDay: true,
      module: { select: { number: true, title: true, color: true } },
      videos: {
        select: {
          id: true,
          order: true,
          title: true,
          youtubeId: true,
          durationMin: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!day) return null;

  const member = await prisma.programMember.findUnique({
    where: { id: memberId },
    select: { highestUnlockedDay: true },
  });
  if (!member) return null;

  const passedSubmission = await prisma.programMissionSubmission.findFirst({
    where: { memberId, dayNumber, passed: true },
    select: { id: true },
  });

  const state = deriveState(
    dayNumber,
    member.highestUnlockedDay,
    !!passedSubmission,
  );

  return { day, state };
}

export async function getMemberDayStates(
  memberId: string,
): Promise<{ modules: CurriculumModule[]; days: CurriculumDay[] }> {
  const member = await prisma.programMember.findUnique({
    where: { id: memberId },
    select: { highestUnlockedDay: true },
  });
  const highestUnlockedDay = member?.highestUnlockedDay ?? 1;

  const [modules, days, passedRows] = await Promise.all([
    prisma.programModule.findMany({
      orderBy: { number: "asc" },
      select: {
        number: true,
        title: true,
        subtitle: true,
        color: true,
        startDay: true,
        endDay: true,
      },
    }),
    prisma.programDay.findMany({
      orderBy: { dayNumber: "asc" },
      select: {
        dayNumber: true,
        title: true,
        missionType: true,
        isProjectDay: true,
        module: { select: { number: true } },
      },
    }),
    prisma.programMissionSubmission.findMany({
      where: { memberId, passed: true },
      select: { dayNumber: true },
      distinct: ["dayNumber"],
    }),
  ]);

  const passedDays = new Set(passedRows.map((r) => r.dayNumber));

  const dayStates: CurriculumDay[] = days.map((d) => ({
    dayNumber: d.dayNumber,
    title: d.title,
    missionType: d.missionType,
    isProjectDay: d.isProjectDay,
    moduleNumber: d.module.number,
    state: deriveState(d.dayNumber, highestUnlockedDay, passedDays.has(d.dayNumber)),
  }));

  return { modules, days: dayStates };
}
