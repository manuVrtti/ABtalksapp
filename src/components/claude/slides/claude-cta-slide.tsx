"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

export function ClaudeCtaSlide() {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-6 text-center shadow-lg backdrop-blur-sm md:p-8">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 md:mb-5 md:h-20 md:w-20"
      >
        <Rocket className="h-8 w-8 text-orange-500 md:h-10 md:w-10" />
      </motion.div>

      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        Ready to Master Claude?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        60 days. Real skills. Real outcomes.
        <br />
        Starting June 1, 2026.
      </p>

      <motion.div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-left md:p-4">
        <h3 className="mb-2 font-display font-semibold text-sm md:text-base">
          📋 Challenge Rules
        </h3>
        <ul className="space-y-1 text-xs text-muted-foreground md:text-sm">
          <li>• 60 days = 60 individual daily posts on LinkedIn</li>
          <li>• Each day requires its own submission (no batching)</li>
          <li>• Posting 3 days of work in one post doesn&apos;t count as 3 days</li>
          <li>• Consistency is the win — missed days break your streak</li>
        </ul>
      </motion.div>

      <p className="mt-4 text-xs text-muted-foreground md:text-sm">
        FREE to join · Open to all roles & students
      </p>
    </motion.div>
  );
}
