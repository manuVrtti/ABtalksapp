"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ChallengeSwitcherEnrollment {
  id: string;
  domain: string;
  challengeTitle: string;
  daysCompleted: number;
}

interface Props {
  enrollments: ChallengeSwitcherEnrollment[];
  activeEnrollmentId: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  SE: "Software Engineering",
  DS: "Data Science",
  AI: "Artificial Intelligence",
  CLAUDE: "Claude AI Mastery",
};

const DOMAIN_COLORS: Record<string, string> = {
  SE: "border-domains-se/50 bg-domains-se-bg text-domains-se",
  DS: "border-domains-ds/50 bg-domains-ds-bg text-domains-ds",
  AI: "border-domains-ai/50 bg-domains-ai-bg text-domains-ai",
  CLAUDE:
    "border-violet-500/40 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
};

export function ChallengeSwitcher({ enrollments, activeEnrollmentId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (enrollments.length < 2) return null;

  const active =
    enrollments.find((e) => e.id === activeEnrollmentId) ?? enrollments[0];

  function handleSwitch(enrollmentId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("challenge", enrollmentId);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "inline-flex h-9 max-w-[220px] items-center gap-2 px-2 sm:max-w-[240px]",
        )}
      >
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold",
            DOMAIN_COLORS[active.domain] ?? "bg-muted text-muted-foreground",
          )}
        >
          {active.domain}
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-sm sm:inline">
          {DOMAIN_LABELS[active.domain] ?? active.domain}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Your challenges
        </div>
        {enrollments.map((enrollment) => {
          const isActive = enrollment.id === activeEnrollmentId;
          return (
            <DropdownMenuItem
              key={enrollment.id}
              onClick={() => handleSwitch(enrollment.id)}
              className="flex cursor-pointer items-start gap-3 py-2.5"
            >
              <div
                className={cn(
                  "shrink-0 rounded border px-2 py-1 text-xs font-bold",
                  DOMAIN_COLORS[enrollment.domain] ??
                    "bg-muted text-muted-foreground",
                )}
              >
                {enrollment.domain}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {DOMAIN_LABELS[enrollment.domain] ?? enrollment.domain}
                </div>
                <div className="text-xs text-muted-foreground">
                  Day {enrollment.daysCompleted} / 60 ·{" "}
                  {enrollment.challengeTitle}
                </div>
              </div>
              {isActive ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
