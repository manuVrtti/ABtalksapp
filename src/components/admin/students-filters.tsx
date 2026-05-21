"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { getStudentsForExport } from "@/app/actions/admin-export-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCSV, toCSV } from "@/lib/csv";
import type { StudentDomainCounts } from "@/features/admin/get-students";
import { cn } from "@/lib/utils";
import type { Domain } from "@prisma/client";

const domainOptions = ["ALL", "SE", "DS", "AI", "CLAUDE"] as const;
const statusOptions = ["ALL", "ACTIVE", "COMPLETED"] as const;

export function StudentsFilters({
  domainCounts,
}: {
  domainCounts: StudentDomainCounts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [isExporting, startExport] = useTransition();

  const currentDomain = useMemo(
    () => searchParams.get("domain") ?? "ALL",
    [searchParams],
  );
  const currentStatus = useMemo(
    () => searchParams.get("status") ?? "ALL",
    [searchParams],
  );

  function pushWith(next: { q?: string; domain?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    if (next.domain !== undefined) {
      if (next.domain && next.domain !== "ALL") params.set("domain", next.domain);
      else params.delete("domain");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function domainCountLabel(domain: (typeof domainOptions)[number]) {
    const count = domainCounts[domain];
    return count > 0 ? `${domain} (${count})` : domain;
  }

  function handleExport() {
    startExport(async () => {
      try {
        const domain =
          currentDomain === "ALL" ? "ALL" : (currentDomain as Domain);
        const data = await getStudentsForExport({
          domain,
          search: searchParams.get("q") ?? undefined,
        });

        if (data.length === 0) {
          toast.error("No students to export");
          return;
        }

        const csv = toCSV(data);
        const date = new Date().toISOString().split("T")[0];
        const filename = `abtalks-students-${currentDomain}-${date}.csv`;
        downloadCSV(filename, csv);
        toast.success(`Exported ${data.length} students`);
      } catch {
        toast.error("Export failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            pushWith({ q: search });
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by full name or email"
            aria-label="Search students"
          />
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="shrink-0"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {domainOptions.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => pushWith({ domain })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              currentDomain === domain
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent",
            )}
          >
            {domainCountLabel(domain)}
          </button>
        ))}
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => pushWith({ status })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              currentStatus === status
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent",
            )}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
