"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProgressDots } from "@/components/landing/progress-dots";
import { ClaudeWelcomeSlide } from "@/components/claude/slides/claude-welcome-slide";
import { ClaudeWhySlide } from "@/components/claude/slides/claude-why-slide";
import { ClaudeRoadmapSlide } from "@/components/claude/slides/claude-roadmap-slide";
import { ClaudeAudienceSlide } from "@/components/claude/slides/claude-audience-slide";
import { ClaudeCtaSlide } from "@/components/claude/slides/claude-cta-slide";

const SLIDES = ["welcome", "why", "roadmap", "audience", "cta"] as const;

const slideVariants = {
  initial: (dir: "next" | "prev") => ({
    opacity: 0,
    x: dir === "next" ? 60 : -60,
    scale: 0.96,
  }),
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: "next" | "prev") => ({
    opacity: 0,
    x: dir === "next" ? -60 : 60,
    scale: 0.96,
  }),
};

export function ClaudeOnboardingClient() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      setDirection("next");
      setCurrentIndex((i) => i + 1);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      setDirection("prev");
      setCurrentIndex((i) => i - 1);
    }
  }

  function goTo(index: number) {
    setDirection(index > currentIndex ? "next" : "prev");
    setCurrentIndex(index);
  }

  const slide = SLIDES[currentIndex];

  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-br from-background via-background to-orange-500/5">
      <ClaudeBackgroundBlobs slideIndex={currentIndex} />

      <div className="relative z-10 flex min-h-svh flex-col">
        <header className="px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <div className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">A</span>Btalks
            </div>
            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
              CLAUDE
            </span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {slide === "welcome" ? <ClaudeWelcomeSlide onNext={next} /> : null}
                {slide === "why" ? (
                  <ClaudeWhySlide onNext={next} onPrev={prev} />
                ) : null}
                {slide === "roadmap" ? (
                  <ClaudeRoadmapSlide onNext={next} onPrev={prev} />
                ) : null}
                {slide === "audience" ? (
                  <ClaudeAudienceSlide onNext={next} onPrev={prev} />
                ) : null}
                {slide === "cta" ? <ClaudeCtaSlide onPrev={prev} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="px-6 py-6">
          <ProgressDots
            total={SLIDES.length}
            current={currentIndex}
            onSelect={goTo}
          />
        </footer>
      </div>
    </div>
  );
}

function ClaudeBackgroundBlobs({ slideIndex }: { slideIndex: number }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        animate={{ x: slideIndex * 20, y: -slideIndex * 10 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"
      />
      <motion.div
        animate={{ x: -slideIndex * 30, y: slideIndex * 20 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute -right-32 top-60 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl"
      />
      <motion.div
        animate={{ x: slideIndex * 15, y: -slideIndex * 25 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
      />
    </div>
  );
}
