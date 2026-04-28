"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const domainOptions = ["ALL", "SE", "DS", "AI"] as const;
const statusOptions = ["ALL", "ACTIVE", "COMPLETED"] as const;

export function StudentsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

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

  return (
    <div className="space-y-3">
      <form
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
    </div>
  );
}
