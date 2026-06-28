"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogSort } from "@/features/marketplace/get-catalog";
import { cn } from "@/lib/utils";

const OPTIONS: { key: CatalogSort; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "newest", label: "What's New" },
];

export function SortControl({ sort }: { sort: CatalogSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeLabel =
    OPTIONS.find((option) => option.key === sort)?.label ?? "Recommended";

  function handleSelect(key: CatalogSort) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", key);
    }
    const qs = params.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="inline-flex h-11 w-full max-w-[270px] items-center justify-between rounded-[5px] border border-[rgba(83,98,123,0.35)] bg-[rgba(7,16,39,0.95)] px-[15px] text-base font-medium text-white"
        >
          <span>
            Sort By : <span className="font-bold">{activeLabel}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-80" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[270px] rounded-[5px] border border-[rgba(83,98,123,0.35)] bg-[rgba(7,16,39,0.95)] p-0 text-[#FAFAFA]"
        >
          <div className="rounded-t-[5px] bg-[rgba(28,40,61,0.69)] px-[15px] py-3 text-base font-medium text-white">
            Sort By : <span className="font-bold">{activeLabel}</span>
          </div>
          {OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.key}
              onClick={() => handleSelect(option.key)}
              className={cn(
                "cursor-pointer rounded-none px-7 py-2 text-base text-[#FAFAFA] focus:bg-[rgba(28,40,61,0.69)] focus:text-white",
                option.key === sort && "font-bold text-white",
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
