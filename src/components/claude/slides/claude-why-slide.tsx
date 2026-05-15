"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function ClaudeWhySlide({ onNext, onPrev }: Props) {
  const items = [
    {
      icon: Users,
      stat: "96%",
      label: "of poll respondents said YES",
      sub: "(Anil Bajpai LinkedIn poll)",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      icon: Zap,
      stat: "10x",
      label: "faster output",
      sub: "with AI-powered workflows",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      icon: TrendingUp,
      stat: "0→1",
      label: "zero to hero",
      sub: "no prior AI needed",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ] as const;

  return (
    <motion.div className="rounded-3xl border bg-card/80 p-8 shadow-lg backdrop-blur-sm md:p-10">
      <h2 className="font-display text-2xl font-bold md:text-3xl">
        Why Claude AI Mastery?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        Claude is the #1 AI benchmark globally — yet most people use only 10%
        of its power.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.stat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="rounded-xl border bg-background/50 p-4"
            >
              <div className={`mb-2 inline-flex rounded-lg p-2 ${item.bg}`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="font-display text-2xl font-bold">{item.stat}</div>
              <div className="mt-1 text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
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
