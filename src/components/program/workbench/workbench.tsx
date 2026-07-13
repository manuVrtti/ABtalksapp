"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetViewer, type WorkbenchAsset } from "./asset-viewer";
import { CheckList, type CheckItem } from "./check-list";
import { cn } from "@/lib/utils";

export type WorkbenchLanguage = "PYTHON" | "SQL" | "JAVASCRIPT" | "YAML";

type Props = {
  language: WorkbenchLanguage | null;
  starterCode?: string | null;
  setupSql?: string | null;
  assets: WorkbenchAsset[];
  visibleChecks: string[];
  onCodeChange?: (code: string) => void;
};

const LANGUAGE_LABEL: Record<WorkbenchLanguage, string> = {
  PYTHON: "Python",
  SQL: "SQL",
  JAVASCRIPT: "JavaScript",
  YAML: "YAML",
};

type Pane = "materials" | "editor" | "console";

export function Workbench({
  language,
  starterCode,
  setupSql,
  assets,
  visibleChecks,
  onCodeChange,
}: Props) {
  const [code, setCode] = useState(starterCode ?? "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [ranOnce, setRanOnce] = useState(false);
  const [pane, setPane] = useState<Pane>("editor");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function setCodeAndNotify(next: string) {
    setCode(next);
    onCodeChange?.(next);
  }

  const checks: CheckItem[] = visibleChecks.map((check) => ({
    check,
    passed: null,
  }));

  async function execute() {
    if (!language || running) return;
    setRunning(true);
    setError(undefined);
    setOutput("");
    setRanOnce(true);
    try {
      if (language === "PYTHON") {
        const mod = await import("./runners/python-runner");
        if (!mod.isPythonLoaded()) {
          setLoadingMsg("Loading Python runtime (~7 MB)…");
        }
        const result = await mod.run(code);
        setOutput(result.output);
        setError(result.error);
      } else if (language === "SQL") {
        const mod = await import("./runners/sql-runner");
        const result = await mod.run(code, setupSql ?? undefined);
        setOutput(result.output);
        setError(result.error);
      } else if (language === "JAVASCRIPT") {
        const mod = await import("./runners/js-runner");
        const result = await mod.run(code);
        setOutput(result.output);
        setError(result.error);
      } else {
        const mod = await import("./runners/yaml-runner");
        const result = await mod.run(code);
        setOutput(result.output);
        setError(result.error);
      }
    } finally {
      setRunning(false);
      setLoadingMsg(null);
      setPane("console");
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void execute();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.slice(0, start) + "  " + code.slice(end);
      setCodeAndNotify(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  const paneTabs: { id: Pane; label: string }[] = [
    { id: "materials", label: "Materials" },
    { id: "editor", label: "Editor" },
    { id: "console", label: "Console" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* mobile pane tabs */}
      <div className="flex border-b lg:hidden">
        {paneTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPane(t.id)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium",
              pane === t.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Materials */}
        <section
          className={cn(
            "space-y-4 border-b p-4 lg:border-b-0 lg:border-r",
            pane !== "materials" && "hidden lg:block",
          )}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Materials
          </h3>
          <AssetViewer assets={assets} />
          {checks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Checks
              </h3>
              <CheckList items={checks} />
            </div>
          )}
        </section>

        {/* Editor */}
        <section
          className={cn(
            "flex flex-col border-b lg:border-b-0 lg:border-r",
            pane !== "editor" && "hidden lg:flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {language ? LANGUAGE_LABEL[language] : "No runner"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCodeAndNotify(starterCode ?? "")}
                disabled={running}
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void execute()}
                disabled={running || !language}
                title="Ctrl/Cmd + Enter"
              >
                <Play className="size-3.5" />
                {running ? "Running…" : "Run"}
              </Button>
            </div>
          </div>
          {language === "PYTHON" && !ranOnce && (
            <div className="flex items-start gap-2 border-b bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Python loads a ~7 MB runtime on first Run and works best on
                desktop.
              </span>
            </div>
          )}
          {language ? (
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCodeAndNotify(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="min-h-[16rem] flex-1 resize-none bg-zinc-950 p-3 font-mono text-sm text-zinc-100 outline-none"
              placeholder="Write your code here…"
            />
          ) : (
            <div className="flex min-h-[16rem] flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
              This mission is verified from your GitHub repo — no code runner
              needed.
            </div>
          )}
        </section>

        {/* Console */}
        <section
          className={cn(
            "flex flex-col",
            pane !== "console" && "hidden lg:flex",
          )}
        >
          <div className="border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Console
            </span>
          </div>
          <div className="min-h-[16rem] flex-1 overflow-auto bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
            {loadingMsg && <p className="text-amber-400">{loadingMsg}</p>}
            {!loadingMsg && !ranOnce && (
              <p className="text-zinc-500">Run your code to see output here.</p>
            )}
            {output && <pre className="whitespace-pre-wrap">{output}</pre>}
            {error && (
              <pre className="whitespace-pre-wrap text-rose-400">{error}</pre>
            )}
            {ranOnce && !running && !output && !error && !loadingMsg && (
              <p className="text-zinc-500">(no output)</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
