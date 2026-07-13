import { prisma } from "@/lib/db";
import { requireProgramMember } from "@/lib/program-auth";
import { getMemberCurrentModuleNumber } from "@/features/program/progression";
import { ArenaClient } from "@/components/program/arena-client";

export default async function ProgramArenaPage() {
  const { member } = await requireProgramMember();
  const currentModule = await getMemberCurrentModuleNumber(member.id);

  const [exercises, completions] = await Promise.all([
    prisma.programExercise.findMany({
      where: { moduleNumber: { lte: currentModule } },
      orderBy: [{ moduleNumber: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        language: true,
        moduleNumber: true,
        description: true,
        starterCode: true,
        setupSql: true,
      },
    }),
    prisma.programExerciseCompletion.findMany({
      where: { memberId: member.id },
      select: { exerciseId: true },
    }),
  ]);

  const completedSet = new Set(completions.map((c) => c.exerciseId));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Practice Arena
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unscored exercises for modules you&apos;ve unlocked. Badges only — no
          points.
        </p>
      </header>

      <ArenaClient
        exercises={exercises.map((e) => ({
          ...e,
          completed: completedSet.has(e.id),
        }))}
      />
    </div>
  );
}
