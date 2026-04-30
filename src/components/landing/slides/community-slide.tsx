"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MessageCircle, ExternalLink } from "lucide-react";

interface CommunitySlideProps {
  onNext: () => void;
  onPrev: () => void;
}

const WHATSAPP_LINK = "https://chat.whatsapp.com/LA5CQJbMczH3QGhSyJDPGK";

export function CommunitySlide({ onNext, onPrev }: CommunitySlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-8 text-center shadow-lg backdrop-blur-sm md:p-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10"
      >
        <MessageCircle className="h-10 w-10 text-emerald-500" />
      </motion.div>

      <h2 className="font-display text-2xl font-bold md:text-3xl">Join the Community</h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        Connect with fellow learners on WhatsApp. Get help, share progress,
        and stay motivated together.
      </p>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
      >
        Join WhatsApp Community
        <ExternalLink className="h-4 w-4" />
      </a>

      <p className="mt-4 text-xs text-muted-foreground">
        Joining is optional but highly recommended.
      </p>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onPrev} className="min-h-11">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} className="group min-h-11">
          Continue
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}
