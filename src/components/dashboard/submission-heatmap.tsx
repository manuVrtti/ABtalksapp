"use client";

import { parseCalendarKeyToUtcDate, formatDateIST } from "@/lib/date-utils";
import type { HeatmapCell } from "@/features/dashboard/get-heatmap-data";
import { cn } from "@/lib/utils";

type Props = {
  data: HeatmapCell[];
};

const STATUS_CLASS: Record<HeatmapCell["status"], string> = {
  on_time: "bg-emerald-500",
  late: "bg-amber-400",
  missed: "bg-red-500",
  pending:
    "border border-dotted border-muted-foreground/40 bg-muted/20 dark:bg-muted/30",
};

function tooltipLabel(cell: HeatmapCell): string {
  const displayDate = formatDateIST(parseCalendarKeyToUtcDate(cell.date));
  switch (cell.status) {
    case "on_time":
      return `Day ${cell.dayNumber} — On time on ${displayDate}`;
    case "late":
      return `Day ${cell.dayNumber} — Late on ${displayDate}`;
    case "missed":
      return `Day ${cell.dayNumber} — Missed on ${displayDate}`;
    case "pending":
    default:
      return `Day ${cell.dayNumber} — Unlocks on ${displayDate}`;
  }
}

export function SubmissionHeatmap({ data }: Props) {
  return (
    <div className="w-full min-w-0">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid w-max max-w-full grid-cols-10 gap-1.5 sm:mx-auto sm:gap-2"
          role="grid"
          aria-label="60-day submission heatmap"
        >
          {data.map((cell, index) => (
            <div
              key={cell.dayNumber}
              role="gridcell"
              title={tooltipLabel(cell)}
              style={{ animationDelay: `${index * 22}ms` }}
              className={cn(
                "size-7 shrink-0 rounded-md opacity-0 animate-heatmap-cell sm:size-9",
                STATUS_CLASS[cell.status],
              )}
            />
          ))}
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span
            className="size-3.5 shrink-0 rounded-sm bg-emerald-500"
            aria-hidden
          />
          On time
        </li>
        <li className="flex items-center gap-2">
          <span
            className="size-3.5 shrink-0 rounded-sm bg-amber-400"
            aria-hidden
          />
          Late
        </li>
        <li className="flex items-center gap-2">
          <span
            className="size-3.5 shrink-0 rounded-sm bg-red-500"
            aria-hidden
          />
          Missed
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block size-3.5 shrink-0 rounded-sm border border-dotted border-muted-foreground/45 bg-muted/25 dark:bg-muted/35"
            aria-hidden
          />
          Pending
        </li>
      </ul>
    </div>
  );
}
