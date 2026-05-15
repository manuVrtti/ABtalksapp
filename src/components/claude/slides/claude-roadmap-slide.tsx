"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const PHASES = [
  {
    number: "01",
    title: "Foundation",
    days: "Days 1-15",
    desc: "Interface · Prompt Engineering · Content & Writing · Claude Skills",
    color: "border-orange-500/30 bg-orange-500/5",
  },
  {
    number: "02",
    title: "Core Use Cases",
    days: "Days 16-30",
    desc: "Code & Dev · Research · Data Analysis · Artifacts · Ecosystem",
    color: "border-pink-500/30 bg-pink-500/5",
  },
  {
    number: "03",
    title: "Automation & Agents",
    days: "Days 31-45",
    desc: "Workflows · MCP Connectors · Plugins · Agentic Claude",
    color: "border-violet-500/30 bg-violet-500/5",
  },
  {
    number: "04",
    title: "Mastery & Capstone",
    days: "Days 46-60",
    desc: "Domain Deep Dive · Advanced Prompting · Showcase",
    color: "border-blue-500/30 bg-blue-500/5",
  },
] as const;

export function ClaudeRoadmapSlide({ onNext, onPrev }: Props) {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-8 shadow-lg backdrop-blur-sm md:p-10">
      <h2 className="font-display text-2xl font-bold md:text-3xl">
        The 4-Phase Roadmap
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Each phase builds on the last. By Day 60, you&apos;ll have shipped a
        capstone.
      </p>

      <div className="mt-6 space-y-3">
        {PHASES.map((phase, i) => (
          <motion.div
            key={phase.number}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            className={`flex items-start gap-4 rounded-xl border p-4 ${phase.color}`}
          >
            <div className="shrink-0 font-display text-3xl font-bold text-muted-foreground/60">
              {phase.number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-display text-lg font-semibold">
                  {phase.title}
                </h3>
                <span className="text-xs text-muted-foreground">{phase.days}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{phase.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={onNext} className="group">
          Continue
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}
