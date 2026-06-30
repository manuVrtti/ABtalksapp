"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { getReferrersForExport } from "@/app/actions/admin-export-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCSV, toCSV } from "@/lib/csv";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value: string): boolean {
  return DATE_KEY_RE.test(value);
}

export function ReferralsFilters({
  start,
  end,
}: {
  start?: string;
  end?: string;
}) {
  const router = useRouter();
  const [startInput, setStartInput] = useState(start ?? "");
  const [endInput, setEndInput] = useState(end ?? "");
  const [isExporting, startExport] = useTransition();

  function buildListUrl(nextStart?: string, nextEnd?: string): string {
    const params = new URLSearchParams();
    if (nextStart && isValidDateKey(nextStart)) params.set("start", nextStart);
    if (nextEnd && isValidDateKey(nextEnd)) params.set("end", nextEnd);
    const qs = params.toString();
    return qs ? `/admin/referrals?${qs}` : "/admin/referrals";
  }

  function handleApply() {
    const nextStart = startInput.trim();
    const nextEnd = endInput.trim();
    if (nextStart && !isValidDateKey(nextStart)) return;
    if (nextEnd && !isValidDateKey(nextEnd)) return;
    router.push(buildListUrl(nextStart || undefined, nextEnd || undefined));
  }

  function handleClear() {
    setStartInput("");
    setEndInput("");
    router.push("/admin/referrals");
  }

  function handleExport() {
    startExport(async () => {
      try {
        const startKey = start && isValidDateKey(start) ? start : undefined;
        const endKey = end && isValidDateKey(end) ? end : undefined;
        const data = await getReferrersForExport({ startKey, endKey });

        if (data.length === 0) {
          toast.error("Nothing to export");
          return;
        }

        const csv = toCSV(data);
        const today = new Date().toISOString().split("T")[0];
        const filename = `abtalks-referrals-${startKey || "all"}_${endKey || "all"}-${today}.csv`;
        downloadCSV(filename, csv);
        toast.success(`Exported ${data.length} referrers`);
      } catch {
        toast.error("Export failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-1 flex-col gap-1 sm:max-w-[11rem]">
        <label htmlFor="referrals-start" className="text-xs text-muted-foreground">
          Start date (IST)
        </label>
        <Input
          id="referrals-start"
          type="date"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 sm:max-w-[11rem]">
        <label htmlFor="referrals-end" className="text-xs text-muted-foreground">
          End date (IST)
        </label>
        <Input
          id="referrals-end"
          type="date"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleApply}>
          Apply
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}
