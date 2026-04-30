"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface CtaSlideProps {
  onPrev: () => void;
}

export function CtaSlide({ onPrev }: CtaSlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-8 text-center shadow-lg backdrop-blur-sm md:p-12"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
      >
        <Rocket className="h-10 w-10 text-primary" />
      </motion.div>

      <h2 className="font-display text-3xl font-bold md:text-5xl">Ready to Begin?</h2>
      <p className="mt-4 text-base text-muted-foreground md:text-lg">
        Your 60-day journey starts now.
        <br />
        Sign in to claim your spot.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8"
      >
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "group min-h-11 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
          )}
        >
          <Rocket className="mr-2 h-5 w-5" />
          Begin Your Journey
        </Link>
      </motion.div>

      <Button variant="ghost" onClick={onPrev} className="mt-4 min-h-11">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </motion.div>
  );
}
