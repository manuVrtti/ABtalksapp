"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { getAnalyticsForExport } from "@/app/actions/admin-export-actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCSV, toCSV } from "@/lib/csv";
import type { TimeRange } from "@/features/admin/get-analytics-data";

export function AnalyticsRangeFilter({ value }: { value: TimeRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExporting, startExport] = useTransition();

  function handleExport() {
    startExport(async () => {
      try {
        const data = await getAnalyticsForExport(value);

        if (data.length === 0) {
          toast.error("No analytics data to export");
          return;
        }

        const csv = toCSV(data);
        const date = new Date().toISOString().split("T")[0];
        const filename = `abtalks-analytics-${value}-${date}.csv`;
        downloadCSV(filename, csv);
        toast.success(`Exported ${data.length} rows`);
      } catch {
        toast.error("Export failed");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs
        value={value}
        onValueChange={(next) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("range", next);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="w-fit"
      >
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting…" : "Export Analytics CSV"}
      </Button>
    </div>
  );
}
