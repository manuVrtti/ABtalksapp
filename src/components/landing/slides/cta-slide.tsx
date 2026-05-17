"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

export function CtaSlide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-6 text-center shadow-lg backdrop-blur-sm md:p-8"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 md:mb-5 md:h-20 md:w-20"
      >
        <Rocket className="h-8 w-8 text-primary md:h-10 md:w-10" />
      </motion.div>

      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        Ready to Begin?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        Your 60-day journey starts now.
        <br />
        Sign in to claim your spot.
      </p>
    </motion.div>
  );
}
