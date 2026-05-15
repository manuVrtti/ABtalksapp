"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onPrev: () => void;
}

const LOGIN_HREF = `/login?from=${encodeURIComponent("/register?domain=CLAUDE")}`;

export function ClaudeCtaSlide({ onPrev }: Props) {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-8 text-center shadow-lg backdrop-blur-sm md:p-12">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10"
      >
        <Rocket className="h-10 w-10 text-orange-500" />
      </motion.div>

      <h2 className="font-display text-3xl font-bold md:text-5xl">
        Ready to Master Claude?
      </h2>
      <p className="mt-4 text-base text-muted-foreground md:text-lg">
        60 days. Real skills. Real outcomes.
        <br />
        Starting June 1, 2026.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8"
      >
        <Link
          href={LOGIN_HREF}
          className={cn(
            buttonVariants({ size: "lg" }),
            "group inline-flex min-h-11 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 text-white hover:opacity-90",
          )}
        >
          <Rocket className="mr-2 h-5 w-5" />
          Reserve My Spot
        </Link>
      </motion.div>

      <p className="mt-4 text-xs text-muted-foreground">
        FREE to join · Open to all roles & students
      </p>

      <Button type="button" variant="ghost" onClick={onPrev} className="mt-4 min-h-11">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </motion.div>
  );
}
