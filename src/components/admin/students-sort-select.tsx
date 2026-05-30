"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortOptions = [
  { value: "recent", label: "Recently joined" },
  { value: "days", label: "Days completed" },
  { value: "streak", label: "Current streak" },
  { value: "referrals", label: "Referrals (top first)" },
] as const;

export function StudentsSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sort") ?? "recent";

  function onSortChange(next: string | null) {
    if (!next) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
