"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShieldX } from "lucide-react";

export function RulesSlide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-6 shadow-lg backdrop-blur-sm md:p-8"
    >
      <motion.div className="flex items-center gap-3">
        <motion.div className="rounded-lg bg-amber-500/10 p-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Community Rules
        </h2>
      </motion.div>

      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        ABTalks is a place to grow with serious learners. Read these carefully.
      </p>

      <motion.div className="mt-5 space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 md:p-4"
        >
          <motion.div className="flex items-start gap-3">
            <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <motion.div>
              <h3 className="font-display font-semibold text-sm md:text-base">
                Foul Language or Harassment
              </h3>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                Any abusive language, harassment, or harmful messaging will lead
                to <strong className="text-foreground">permanent ban</strong> from
                ABTalks.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 md:p-4"
        >
          <motion.div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <motion.div>
              <h3 className="font-display font-semibold text-sm md:text-base">
                Cheating or Platform Misuse
              </h3>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                Submitting plagiarized work or misusing the platform will result
                in a{" "}
                <strong className="text-foreground">60-day challenge ban</strong>.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-xs text-muted-foreground md:text-sm"
        >
          By continuing, you agree to follow these rules. Be real, be respectful,
          and ship real work.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
