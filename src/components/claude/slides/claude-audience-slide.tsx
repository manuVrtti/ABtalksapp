"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Building,
  Code2,
  Compass,
  FileText,
} from "lucide-react";

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

export function ClaudeAudienceSlide() {
  return (
    <motion.div className="rounded-3xl border bg-card/80 p-6 shadow-lg backdrop-blur-sm md:p-8">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        Who Is This For?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        One challenge. Every role. Zero to Hero.
      </p>

      <motion.div className="mt-5 grid grid-cols-2 gap-2 md:gap-3">
        {ROLES.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              className="rounded-xl border bg-background/50 p-2.5 md:p-3"
            >
              <motion.div className="mb-1.5 w-fit rounded-lg bg-orange-500/10 p-1.5 md:mb-2 md:p-2">
                <Icon className="h-4 w-4 text-orange-500" />
              </motion.div>
              <h3 className="font-display font-semibold text-sm md:text-base">
                {role.title}
              </h3>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground md:text-sm">
                {role.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
