"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

export function CtaSlide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-5 text-center shadow-lg backdrop-blur-sm md:p-6"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
      >
        <Rocket className="h-8 w-8 text-primary" />
      </motion.div>

      <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
        Ready to Begin?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your 60-day journey starts now.
        <br />
        Sign in to claim your spot.
      </p>
    </motion.div>
  );
}
