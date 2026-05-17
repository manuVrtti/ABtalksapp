"use client";

import { motion } from "framer-motion";
import { Code2, Trophy, Users } from "lucide-react";

export function AboutSlide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border bg-card/80 p-6 shadow-lg backdrop-blur-sm md:p-8"
    >
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        What is ABTalks?
      </h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        ABTalks is a 60-day coding challenge built around Anil Bajpai&apos;s
        community of recruiters and students. Pick a domain, code daily, post
        your progress, and become discoverable to recruiters.
      </p>

      <motion.div className="mt-5 space-y-2.5">
        {[
          {
            icon: Code2,
            title: "Daily Challenges",
            desc: "Real coding tasks across AI, Data Science, or Software Engineering",
          },
          {
            icon: Users,
            title: "Public Accountability",
            desc: "Post your work on GitHub & LinkedIn — build your portfolio",
          },
          {
            icon: Trophy,
            title: "Get Discovered",
            desc: "Complete the challenge → recruiters from our network see your profile",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            className="flex items-start gap-3 rounded-xl border bg-background/50 p-3 md:p-4"
          >
            <motion.div className="rounded-lg bg-primary/10 p-2">
              <item.icon className="h-5 w-5 text-primary" />
            </motion.div>
            <motion.div>
              <h3 className="font-display font-semibold text-sm md:text-base">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {item.desc}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
