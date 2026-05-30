"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Wrench,
  ListChecks,
  FileCode,
  Share2,
  FileOutput,
  Copy,
  Check,
  ExternalLink,
  Send,
  Clock,
  Award,
  Tag,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  submitGithubStepAction,
  submitLinkedinStepAction,
} from "@/app/actions/submission-actions";

export interface LearningBullet {
  label: string;
  text: string;
}

export interface DayContent {
  title: string;
  tagline: string;
  module: string;
  difficulty: string;
  estimatedMinutes: number;
  deliverableFormat: string;
  learning: {
    summary: string;
    bullets: LearningBullet[];
  };
  tool?: {
    name: string;
    type: string;
    description: string;
    setupTitle: string;
    setupSteps: string[];
    linkUrl: string;
    linkLabel: string;
  };
  task: {
    title: string;
    steps: string[];
    solutionVideoUrl?: string;
  };
  solutionVideoUrl?: string;
  resources?: string[];
  promptTemplate: string;
  engagement: {
    type: string;
    description: string;
    hashtag: string;
  };
  deliverable: {
    description: string;
    format: string;
  };
}

interface Props {
  dayNumber: number;
  content: DayContent;
  enrollmentId: string;
  /** Seeded from DailyTask.resources when passed by the parent page */
  resources?: string[];
  existingSubmission?: { githubUrl: string; linkedinUrl: string } | null;
}

export function DayPage({
  dayNumber,
  content,
  enrollmentId,
  resources: resourcesProp,
  existingSubmission,
}: Props) {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState(
    existingSubmission?.linkedinUrl ?? "",
  );
  const [artifactUrl, setArtifactUrl] = useState(
    existingSubmission?.githubUrl ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const solutionVideoUrl =
    content.solutionVideoUrl ?? content.task.solutionVideoUrl;
  const resources = resourcesProp ?? content.resources ?? [];

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(content.promptTemplate);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  };

  const handleSubmit = async () => {
    if (!linkedinUrl.trim() || !artifactUrl.trim()) {
      toast.error("Both fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const githubFd = new FormData();
      githubFd.append("githubUrl", artifactUrl.trim());
      githubFd.append("dayNumber", String(dayNumber));
      githubFd.append("enrollmentId", enrollmentId);

      const githubResult = await submitGithubStepAction(githubFd);
      if (!githubResult.ok) {
        toast.error(githubResult.message);
        setSubmitting(false);
        return;
      }

      const linkedinFd = new FormData();
      linkedinFd.append("githubUrl", githubResult.githubUrl);
      linkedinFd.append("linkedinUrl", linkedinUrl.trim());
      linkedinFd.append("dayNumber", String(dayNumber));
      linkedinFd.append("enrollmentId", enrollmentId);

      const result = await submitLinkedinStepAction(linkedinFd);

      if (result.ok) {
        toast.success(`Day ${dayNumber} submitted! 🔥`);
        router.push(
          `/dashboard?challenge=${encodeURIComponent(enrollmentId)}`,
        );
      } else {
        toast.error(result.message);
        setSubmitting(false);
      }
    } catch {
      toast.error("Submission failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{content.module}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-sm font-bold tracking-wider text-primary uppercase">
              Day {dayNumber}
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {content.title}
          </h1>
          <p className="text-base text-muted-foreground italic md:text-lg">
            {content.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Award className="h-3 w-3" />
              {content.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs">
              <Clock className="h-3 w-3" />
              {content.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs">
              <FileOutput className="h-3 w-3" />
              Deliverable: {content.deliverableFormat}
            </span>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="font-display text-lg font-semibold">
              What You&apos;ll Learn
            </h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {content.learning.summary}
          </p>

          <ol className="space-y-2.5">
            {content.learning.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {i + 1}
                </div>
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{bullet.label}:</span>
                  <span className="text-muted-foreground"> {bullet.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        {content.tool ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="rounded-2xl border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-pink-500/5 p-6"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
                Tool of the Day
              </span>
            </div>

            <h2 className="font-display mb-1 text-2xl font-bold">
              {content.tool.name}
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              {content.tool.type}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {content.tool.description}
            </p>

            <div className="mb-4 rounded-xl border bg-background/60 p-4">
              <h3 className="mb-3 text-sm font-semibold">
                {content.tool.setupTitle}
              </h3>
              <ol className="space-y-2">
                {content.tool.setupSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <a
              href={content.tool.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              {content.tool.linkLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          </motion.section>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <ListChecks className="h-5 w-5 text-emerald-500" />
            </div>
            <h2 className="font-display text-lg font-semibold">
              {content.task.title}
            </h2>
          </div>

          <ol className="space-y-3">
            {content.task.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {i + 1}
                </div>
                <span className="pt-0.5 text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="rounded-2xl border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <FileCode className="h-5 w-5 text-violet-500" />
              </div>
              <h2 className="font-display text-lg font-semibold">
                Prompt Template
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyPrompt()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            Customize the bracketed parts for your situation
          </p>

          <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap md:text-sm">
            {content.promptTemplate}
          </pre>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="rounded-2xl border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-pink-500/10 p-2">
              <Share2 className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                Engagement Activity
              </h2>
              <p className="text-xs text-muted-foreground">
                {content.engagement.type}
              </p>
            </div>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            {content.engagement.description}
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1 font-mono text-xs font-semibold text-pink-600 dark:text-pink-400">
            <Tag className="h-3 w-3" />
            {content.engagement.hashtag}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.4 }}
          className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-blue-500/10 p-2">
              <FileOutput className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">
                Your Deliverable
              </h3>
              <p className="text-sm text-muted-foreground">
                {content.deliverable.description}
              </p>
              <span className="mt-2 inline-block font-mono text-xs font-semibold text-muted-foreground">
                Format: {content.deliverable.format}
              </span>
            </div>
          </div>
        </motion.section>

        {solutionVideoUrl ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="rounded-2xl border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-red-500/10 p-2">
                <PlayCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Solution Walkthrough
                </h2>
                <p className="text-xs text-muted-foreground">
                  Step-by-step video guide
                </p>
              </div>
            </div>

            {solutionVideoUrl.includes("REPLACE_WITH") ? (
              <p className="text-sm text-muted-foreground">
                Solution walkthrough video coming soon — check back shortly.
              </p>
            ) : (
              <a
                href={solutionVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <PlayCircle className="h-4 w-4" />
                Watch on YouTube
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </motion.section>
        ) : null}

        {resources.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4 }}
            className="rounded-2xl border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-sky-500/10 p-2">
                <BookOpen className="h-5 w-5 text-sky-500" />
              </div>
              <h2 className="font-display text-lg font-semibold">Resources</h2>
            </div>

            <ul className="space-y-2">
              {resources.map((url, i) => {
                let label = url;
                try {
                  const u = new URL(url);
                  label = u.hostname.replace("www.", "") + u.pathname;
                  if (label.endsWith("/")) label = label.slice(0, -1);
                } catch {
                  // fall back to raw URL if parsing fails
                }

                return (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-sky-600 hover:underline dark:text-sky-400"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="break-all">{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        ) : null}
      </main>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t bg-background/95 backdrop-blur-md">
        <div className="container mx-auto max-w-3xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <div className="min-w-0 flex-1">
              <Input
                type="url"
                placeholder="LinkedIn post URL"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="text-sm"
                disabled={submitting}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Input
                type="url"
                placeholder="Claude artifact URL"
                value={artifactUrl}
                onChange={(e) => setArtifactUrl(e.target.value)}
                className="text-sm"
                disabled={submitting}
              />
            </div>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting || !linkedinUrl.trim() || !artifactUrl.trim()}
              className="shrink-0 gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : `Submit Day ${dayNumber}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
