"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const domainOptions = ["ALL", "SE", "DS", "AI"] as const;
const statusOptions = ["ALL", "ON_TIME", "LATE"] as const;

export function SubmissionsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDomain = useMemo(
    () => searchParams.get("domain") ?? "ALL",
    [searchParams],
  );
  const currentStatus = useMemo(
    () => searchParams.get("status") ?? "ALL",
    [searchParams],
  );
  const minDay = searchParams.get("minDay") ?? "";
  const maxDay = searchParams.get("maxDay") ?? "";

  function pushWith(next: {
    domain?: string;
    status?: string;
    minDay?: string;
    maxDay?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.domain !== undefined) {
      if (next.domain && next.domain !== "ALL") params.set("domain", next.domain);
      else params.delete("domain");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    if (next.minDay !== undefined) {
      if (next.minDay) params.set("minDay", next.minDay);
      else params.delete("minDay");
    }
    if (next.maxDay !== undefined) {
      if (next.maxDay) params.set("maxDay", next.maxDay);
      else params.delete("maxDay");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
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
            {domain}
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
      <form
        className="flex flex-wrap items-center gap-2 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          pushWith({
            minDay: String(form.get("minDay") ?? ""),
            maxDay: String(form.get("maxDay") ?? ""),
          });
        }}
      >
        <label className="text-muted-foreground" htmlFor="minDay">
          Day from
        </label>
        <input
          id="minDay"
          name="minDay"
          type="number"
          min={1}
          max={60}
          defaultValue={minDay}
          className="h-8 w-20 rounded-md border px-2"
        />
        <label className="text-muted-foreground" htmlFor="maxDay">
          to
        </label>
        <input
          id="maxDay"
          name="maxDay"
          type="number"
          min={1}
          max={60}
          defaultValue={maxDay}
          className="h-8 w-20 rounded-md border px-2"
        />
        <button className="rounded-md border px-3 py-1.5">Apply</button>
      </form>
    </div>
  );
}
