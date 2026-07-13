"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Workbench, type WorkbenchLanguage } from "@/components/program/workbench/workbench";
import { completeArenaExerciseAction } from "@/app/actions/program-arena-actions";
import { cn } from "@/lib/utils";

export type ArenaExercise = {
  id: string;
  slug: string;
  title: string;
  language: WorkbenchLanguage;
  moduleNumber: number;
  description: string;
  starterCode: string;
  setupSql: string | null;
  completed: boolean;
};

export function ArenaClient({ exercises }: { exercises: ArenaExercise[] }) {
  const [selectedId, setSelectedId] = useState(exercises[0]?.id ?? "");
  const [code, setCode] = useState(exercises[0]?.starterCode ?? "");
  const [output, setOutput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedIds, setCompletedIds] = useState(
    () => new Set(exercises.filter((e) => e.completed).map((e) => e.id)),
  );

  const selected = useMemo(
    () => exercises.find((e) => e.id === selectedId) ?? exercises[0],
    [exercises, selectedId],
  );

  function selectExercise(ex: ArenaExercise) {
    setSelectedId(ex.id);
    setCode(ex.starterCode);
    setOutput("");
  }

  async function handleComplete() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const result = await completeArenaExerciseAction({
        exerciseId: selected.id,
        code,
        output,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCompletedIds((prev) => new Set(prev).add(selected.id));
      toast.success("Exercise completed!");
    } finally {
      setSubmitting(false);
    }
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Practice exercises are being prepared.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => selectExercise(ex)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
              selected?.id === ex.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
            )}
          >
            {completedIds.has(ex.id) ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            ) : (
              <Play className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="line-clamp-2">{ex.title}</span>
          </button>
        ))}
      </aside>

      {selected && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">{selected.title}</h2>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          </div>
          <Workbench
            language={selected.language}
            starterCode={selected.starterCode}
            setupSql={selected.setupSql}
            assets={[]}
            visibleChecks={[]}
            onCodeChange={(c) => {
              setCode(c);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Run your code in the Workbench, then submit the console output here.
            Practice Arena awards no points — engagement only.
          </p>
          <div className="flex gap-2">
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Paste the output from Run here…"
              className="min-h-20 flex-1 rounded-lg border bg-muted/30 p-2 font-mono text-xs"
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleComplete()}
            disabled={submitting || completedIds.has(selected.id)}
          >
            {completedIds.has(selected.id)
              ? "Completed"
              : submitting
                ? "Checking…"
                : "Submit output"}
          </Button>
        </div>
      )}
    </div>
  );
}
