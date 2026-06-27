"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// TODO: add price asc/desc, newest
export function SortControl() {
  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="inline-flex h-11 w-full max-w-[270px] items-center justify-between rounded-[5px] border border-[rgba(83,98,123,0.35)] bg-[rgba(7,16,39,0.95)] px-[15px] text-base font-medium text-white"
        >
          <span>
            Sort By : <span className="font-bold">Recommended</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-80" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[270px] rounded-[5px] border border-[rgba(83,98,123,0.35)] bg-[rgba(7,16,39,0.95)] p-0 text-[#FAFAFA]"
        >
          <div className="rounded-t-[5px] bg-[rgba(28,40,61,0.69)] px-[15px] py-3 text-base font-medium text-white">
            Sort By : <span className="font-bold">Recommended</span>
          </div>
          <DropdownMenuItem disabled className="px-7 py-2 text-base text-[#FAFAFA]">
            Recommended
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
