import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Award, Clock } from "lucide-react";
import type { ProgramMissionType } from "@prisma/client";
import { requireProgramMember } from "@/lib/program-auth";
import { getDayShell } from "@/features/program/days";
import { LiteYoutube } from "@/components/program/lite-youtube";
import { Workbench, type WorkbenchLanguage } from "@/components/program/workbench/workbench";
import type { WorkbenchAsset } from "@/components/program/workbench/asset-viewer";

type Props = { params: Promise<{ day: string }> };

const MISSION_LABEL: Record<ProgramMissionType, string> = {
  CODE_SPRINT: "Code Sprint",
  SHIP_IT: "Ship It",
  DATA_ROOM: "Data Room",
  PROMPT_FORGE: "Prompt Forge",
  BOSS_BUILD: "Boss Build",
};

function isAsset(value: unknown): value is WorkbenchAsset {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: unknown; content?: unknown };
  return (
    (v.type === "csv" || v.type === "file" || v.type === "markdown") &&
    typeof v.content === "string"
  );
}

// assetsJson is the ONLY client-safe day asset field. Parse it defensively into
// the shapes the client Workbench understands.
function parseAssets(assetsJson: unknown): {
  assets: WorkbenchAsset[];
  setupSql: string | null;
  visibleChecks: string[];
} {
  if (!assetsJson || typeof assetsJson !== "object") {
    return { assets: [], setupSql: null, visibleChecks: [] };
  }
  const obj = assetsJson as Record<string, unknown>;
  const rawAssets = Array.isArray(obj.assets)
    ? obj.assets
    : Array.isArray(assetsJson)
      ? (assetsJson as unknown[])
      : [];
  const assets = rawAssets.filter(isAsset);
  const setupSql = typeof obj.setupSql === "string" ? obj.setupSql : null;
  const visibleChecks = Array.isArray(obj.visibleChecks)
    ? obj.visibleChecks.filter((c): c is string => typeof c === "string")
    : [];
  return { assets, setupSql, visibleChecks };
}

export default async function ProgramDayPage({ params }: Props) {
  const { member } = await requireProgramMember();
  const { day: dayParam } = await params;
  const dayNumber = Number.parseInt(dayParam, 10);
  if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    redirect("/program/curriculum");
  }

  const result = await getDayShell(member.id, dayNumber);
  if (!result || result.state === "LOCKED") {
    redirect("/program/curriculum");
  }

  const { day } = result;
  const { assets, setupSql, visibleChecks } = parseAssets(day.assetsJson);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: day.module.color }}
            aria-hidden
          />
          <span>
            Module {day.module.number} · {day.module.title}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Day {day.dayNumber}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {day.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {MISSION_LABEL[day.missionType]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs">
            <Award className="size-3" />
            {day.missionPoints} pts
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs">
            <Clock className="size-3" />
            {day.estimatedMin} min
          </span>
        </div>
      </header>

      <section className="space-y-2 text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3">
        <ReactMarkdown>{day.briefMd}</ReactMarkdown>
      </section>

      {(day.objectives.length > 0 || day.tools.length > 0) && (
        <section className="space-y-3">
          {day.objectives.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Objectives
              </h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {day.objectives.map((o, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {day.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {day.tools.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {day.videos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Watch
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {day.videos.map((video) => (
              <div key={video.id} className="space-y-1.5">
                <LiteYoutube youtubeId={video.youtubeId} title={video.title} />
                <p className="text-sm font-medium">{video.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workbench
        </h2>
        <Workbench
          language={day.language as WorkbenchLanguage | null}
          starterCode={day.starterCode}
          setupSql={setupSql}
          assets={assets}
          visibleChecks={visibleChecks}
        />
        <div className="rounded-xl border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Experiment freely with Run. Mission submission and verification open
            soon.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 inline-flex cursor-not-allowed items-center rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground opacity-70"
          >
            Submit mission (coming online)
          </button>
        </div>
      </section>
    </div>
  );
}
