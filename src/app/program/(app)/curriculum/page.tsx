import Link from "next/link";
import { CheckCircle2, Circle, Lock, SkipForward } from "lucide-react";
import type { ProgramMissionType } from "@prisma/client";
import { requireProgramMember } from "@/lib/program-auth";
import {
  getMemberDayStates,
  type CurriculumDay,
  type DayState,
} from "@/features/program/days";
import { cn } from "@/lib/utils";

const MISSION_LABEL: Record<ProgramMissionType, string> = {
  CODE_SPRINT: "Code Sprint",
  SHIP_IT: "Ship It",
  DATA_ROOM: "Data Room",
  PROMPT_FORGE: "Prompt Forge",
  BOSS_BUILD: "Boss Build",
};

function StateIcon({ state }: { state: DayState }) {
  switch (state) {
    case "PASSED":
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case "SKIPPED":
      return <SkipForward className="size-4 text-amber-500" />;
    case "AVAILABLE":
      return <Circle className="size-4 animate-pulse text-primary" />;
    default:
      return <Lock className="size-4 text-muted-foreground/60" />;
  }
}

function DayCard({ day }: { day: CurriculumDay }) {
  const locked = day.state === "LOCKED";
  const inner = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-xl border p-3 transition-colors",
        locked
          ? "border-border/60 bg-muted/30"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          Day {day.dayNumber}
        </span>
        <StateIcon state={day.state} />
      </div>
      <p className="line-clamp-2 text-sm font-medium">{day.title}</p>
      <span className="mt-auto inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
        {MISSION_LABEL[day.missionType]}
      </span>
    </div>
  );

  if (locked) return inner;
  return (
    <Link href={`/program/day/${day.dayNumber}`} className="focus-spark">
      {inner}
    </Link>
  );
}

export default async function ProgramCurriculumPage() {
  const { member } = await requireProgramMember();
  const { modules, days } = await getMemberDayStates(member.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Curriculum
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your 30-day path. Pass each mission to unlock the next day.
        </p>
      </header>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The curriculum is being prepared. Check back soon.
        </p>
      ) : (
        modules.map((module) => {
          const moduleDays = days.filter(
            (d) => d.moduleNumber === module.number,
          );
          return (
            <section key={module.number} className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: module.color }}
                  aria-hidden
                />
                <h2 className="font-display text-lg font-semibold">
                  Module {module.number} · {module.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{module.subtitle}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {moduleDays.map((day) => (
                  <DayCard key={day.dayNumber} day={day} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
