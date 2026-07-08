"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkbenchAsset =
  | { type: "csv"; name: string; content: string }
  | { type: "file"; name: string; language?: string; content: string }
  | { type: "markdown"; content: string };

const CSV_PREVIEW_ROWS = 20;

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim()));
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CsvAsset({ name, content }: { name: string; content: string }) {
  const rows = parseCsv(content);
  const header = rows[0] ?? [];
  const body = rows.slice(1, CSV_PREVIEW_ROWS + 1);
  const remaining = Math.max(0, rows.length - 1 - body.length);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{name}</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/60">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-2 py-1.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="border-t">
                {row.map((cell, c) => (
                  <td key={c} className="whitespace-nowrap px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">+{remaining} more rows</p>
      )}
    </div>
  );
}

function FileAsset({
  name,
  content,
}: {
  name: string;
  content: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{name}</p>
        <CopyButton text={content} />
      </div>
      <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
        {content}
      </pre>
    </div>
  );
}

export function AssetViewer({
  assets,
  className,
}: {
  assets: WorkbenchAsset[];
  className?: string;
}) {
  if (assets.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No materials for this mission.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {assets.map((asset, i) => {
        if (asset.type === "csv") {
          return <CsvAsset key={i} name={asset.name} content={asset.content} />;
        }
        if (asset.type === "file") {
          return <FileAsset key={i} name={asset.name} content={asset.content} />;
        }
        return (
          <div
            key={i}
            className="space-y-2 text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:text-muted-foreground"
          >
            <ReactMarkdown>{asset.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
