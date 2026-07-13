import { requireProgramMember } from "@/lib/program-auth";
import { getProgramLeaderboard } from "@/features/program/leaderboard";
import { cn } from "@/lib/utils";

export default async function ProgramLeaderboardPage() {
  const { member, cohort } = await requireProgramMember();
  const rows = await getProgramLeaderboard(cohort.id, member.id);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorted by total score, then projects, missions, enrollment date.
        </p>
      </header>

      {podium.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {podium.map((row) => (
            <div
              key={row.memberId}
              className={cn(
                "rounded-xl border p-4 text-center",
                row.isViewer && "border-primary bg-primary/5",
                row.rank === 1 && "sm:order-2 sm:-mt-2",
                row.rank === 2 && "sm:order-1",
                row.rank === 3 && "sm:order-3",
              )}
            >
              <p className="text-3xl font-bold text-muted-foreground">
                #{row.rank}
              </p>
              <p className="mt-1 font-semibold">{row.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {row.company} · {row.jobRole}
              </p>
              <p className="mt-2 font-display text-xl font-bold">
                {row.totalScore} pts
              </p>
              <p className="text-xs text-muted-foreground">
                {row.cleanPassPct}% clean passes
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Yrs</th>
              <th className="px-3 py-2">M/C/C/P</th>
              <th className="px-3 py-2">Clean%</th>
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {[...podium, ...rest].map((row) => (
              <tr
                key={row.memberId}
                className={cn(
                  "border-b last:border-0",
                  row.isViewer && "bg-primary/5",
                )}
              >
                <td className="px-3 py-2 font-medium">{row.rank}</td>
                <td className="px-3 py-2">{row.fullName}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.company}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.jobRole}</td>
                <td className="px-3 py-2">{row.yearsExperience}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {row.missionPoints}/{row.conceptPoints}/{row.commitPoints}/
                  {row.projectPoints}
                </td>
                <td className="px-3 py-2">{row.cleanPassPct}%</td>
                <td className="px-3 py-2 font-semibold">{row.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
