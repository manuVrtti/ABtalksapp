"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

interface Props {
  totalCount: number;
}

function BuildersBadge({ totalCount }: { totalCount: number }) {
  const isEarly = totalCount < 50;
  const displayCount = Math.max(50, Math.floor(totalCount / 50) * 50);
  const badgeText = isEarly
    ? "🔥 Be among the first 100 builders"
    : `🔥 Join ${displayCount}+ builders already enrolled`;

  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1">
      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
        {badgeText}
      </span>
    </div>
  );
}

export function ClaudeCtaSlide({ totalCount }: Props) {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-5 text-center shadow-lg backdrop-blur-sm md:p-6">
      <BuildersBadge totalCount={totalCount} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10"
      >
        <Rocket className="h-8 w-8 text-orange-500" />
      </motion.div>

      <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
        Ready to Master Claude?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        60 days. Real skills. Real outcomes.
        <br />
        Starting June 1, 2026.
      </p>

      <motion.div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-left">
        <h3 className="mb-1.5 font-display text-sm font-semibold">
          📋 Challenge Rules
        </h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• 60 days = 60 individual daily posts on LinkedIn</li>
          <li>• Each day requires its own submission (no batching)</li>
          <li>• Posting 3 days of work in one post doesn&apos;t count as 3 days</li>
          <li>• Consistency is the win: missed days break your streak</li>
        </ul>
      </motion.div>

      <p className="mt-3 text-xs text-muted-foreground">
        FREE to join · Open to all roles & students
      </p>
    </motion.div>
  );
}
