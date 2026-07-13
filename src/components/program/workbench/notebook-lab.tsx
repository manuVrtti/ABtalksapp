"use client";

import { AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  dayTitle: string;
  notebookPath: string | null;
  iframeNotebookPath: string;
  githubRepoUrl: string;
  gitSubmitSnippet: string;
  colabUrl: string;
  codespacesUrl: string;
  githubFileUrl: string;
  colabHint: string | null;
};

export function NotebookLab({
  dayTitle,
  notebookPath,
  iframeNotebookPath,
  githubRepoUrl,
  gitSubmitSnippet,
  colabUrl,
  codespacesUrl,
  githubFileUrl,
  colabHint,
}: Props) {
  const iframeSrc = `/lab/lab/index.html?path=${encodeURIComponent(iframeNotebookPath)}`;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notebook Lab
          </p>
          <p className="truncate text-sm font-medium">{dayTitle}</p>
          {notebookPath && (
            <p className="truncate font-mono text-xs text-muted-foreground">
              Submit to: {notebookPath}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <HelpCircle className="size-3.5" />
                  How to submit
                </Button>
              }
            />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit via Git</DialogTitle>
                <DialogDescription>
                  Notebooks are graded from your program repo — push your{" "}
                  <code className="rounded bg-muted px-1">.ipynb</code> file, then
                  click Submit for verification on this page.
                </DialogDescription>
              </DialogHeader>
              <pre className="overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">
                {gitSubmitSnippet}
              </pre>
              <p className="text-xs text-muted-foreground">
                Repo:{" "}
                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {githubRepoUrl}
                </a>
              </p>
            </DialogContent>
          </Dialog>
          <Link
            href={colabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="size-3.5" />
            Colab
          </Link>
          <Link
            href={codespacesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="size-3.5" />
            Codespaces
          </Link>
          <Link
            href={githubFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="size-3.5" />
            View repo
          </Link>
        </div>
      </div>

      {colabHint && (
        <div className="flex items-start gap-2 border-b bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{colabHint}</span>
        </div>
      )}

      <div className="flex items-start gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span>
          JupyterLite runs in your browser and works best on desktop. Your work
          persists locally until you push to GitHub.
        </span>
      </div>

      <iframe
        title={`Notebook lab — ${dayTitle}`}
        src={iframeSrc}
        className="h-[min(70vh,720px)] w-full border-0 bg-background"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals allow-popups"
      />
    </div>
  );
}
