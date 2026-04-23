"use client";

import {
  CheckCircle2,
  Clock,
  Copy,
  Medal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReferralStats } from "@/features/profile/get-referral-stats";

type Props = {
  referralCode: string;
  stats: ReferralStats;
  referralLink: string;
};

const BADGE_LABEL: Record<ReferralStats["currentBadge"], string> = {
  none: "No badge yet",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const MEDAL_CLASS: Record<Exclude<ReferralStats["currentBadge"], "none">, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  platinum: "text-purple-500",
};

export function ReferralCard({ referralCode, stats, referralLink }: Props) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  const { currentBadge, nextBadge, rewardedReferrals } = stats;

  const progressToNext =
    nextBadge && nextBadge.requiredCount > 0
      ? Math.min(
          100,
          Math.round((rewardedReferrals / nextBadge.requiredCount) * 100),
        )
      : currentBadge === "platinum"
        ? 100
        : 0;

  const moreToNext =
    nextBadge !== null
      ? Math.max(0, nextBadge.requiredCount - rewardedReferrals)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your referral link</CardTitle>
        <CardDescription>
          Share this link so others can join with your code{" "}
          <span className="font-mono font-medium text-foreground">
            {referralCode}
          </span>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          {currentBadge === "none" ? (
            <div className="flex size-10 items-center justify-center rounded-full border border-dashed bg-muted/50 text-xs text-muted-foreground">
              —
            </div>
          ) : (
            <Medal
              className={cn(
                "size-10 shrink-0",
                MEDAL_CLASS[
                  currentBadge as keyof typeof MEDAL_CLASS
                ],
              )}
              strokeWidth={1.5}
              aria-hidden
            />
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current tier
            </p>
            <p className="text-lg font-semibold">{BADGE_LABEL[currentBadge]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {stats.rewardedReferrals}
          </span>{" "}
          completed ·{" "}
          <span className="font-medium text-foreground">
            {stats.pendingReferrals}
          </span>{" "}
          in progress
        </p>

        {nextBadge ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {moreToNext > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {moreToNext} more
                  </span>{" "}
                  to reach {nextBadge.name}
                </>
              ) : (
                <>You&apos;ve reached {nextBadge.name} — keep inviting!</>
              )}
            </p>
            <Progress value={progressToNext}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
        ) : currentBadge === "platinum" ? (
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached the highest referral tier.
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
            {referralLink}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => void copyLink()}
          >
            <Copy className="size-4" aria-hidden />
            Copy link
          </Button>
        </div>

        {stats.totalReferrals > 0 ? (
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Your referrals</h3>
            <ul className="space-y-3">
              {stats.referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium">{r.referredName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{r.referredDomain}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Joined{" "}
                        {new Date(r.joinedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {r.completedDay7 ? (
                    <CheckCircle2
                      className="size-5 shrink-0 text-green-600 dark:text-green-500"
                      aria-label="Completed day 7"
                    />
                  ) : (
                    <Clock
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-label="In progress"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
