"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building,
  Code2,
  Compass,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const ROLES = [
  {
    icon: Code2,
    title: "Developer",
    desc: "Code gen, debugging, Claude API, RAG pipelines",
  },
  {
    icon: FileText,
    title: "Business Analyst",
    desc: "BRDs, use cases, stakeholder simulations",
  },
  {
    icon: Briefcase,
    title: "Product Manager",
    desc: "PRDs, roadmaps, user stories, OKRs",
  },
  {
    icon: Compass,
    title: "Architect",
    desc: "System design, ADRs, Mermaid diagrams",
  },
  {
    icon: Building,
    title: "Leader / Manager",
    desc: "Strategy, board decks, performance reviews",
  },
  {
    icon: BookOpen,
    title: "Student",
    desc: "Essays, research, exam prep, NotebookLM",
  },
] as const;

export function ClaudeAudienceSlide({ onNext, onPrev }: Props) {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-8 shadow-lg backdrop-blur-sm md:p-10">
      <h2 className="font-display text-2xl font-bold md:text-3xl">
        Who Is This For?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        One challenge. Every role. Zero to Hero.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {ROLES.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              className="rounded-xl border bg-background/50 p-3"
            >
              <div className="mb-2 w-fit rounded-lg bg-orange-500/10 p-2">
                <Icon className="h-4 w-4 text-orange-500" />
              </div>
              <h3 className="text-sm font-semibold">{role.title}</h3>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                {role.desc}
              </p>
            </motion.div>
          );
        })}
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
