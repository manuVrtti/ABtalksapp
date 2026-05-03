"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DailyTask, Domain } from "@prisma/client";
import confetti from "canvas-confetti";
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  Flame,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitGithubStepAction,
  submitLinkedinStepAction,
} from "@/app/actions/submission-actions";

type Props = {
  dayNumber: number;
  task: Pick<DailyTask, "title" | "problemStatement">;
  userDomain: Domain;
};

export function SubmissionFlow({ dayNumber, task, userDomain }: Props) {
  const [step, setStep] = useState<"github" | "linkedin" | "success">("github");
  const [githubUrl, setGithubUrl] = useState("");
  /** Snapshot from server when entering step 2 — used for reset only. */
  const [originalLinkedinTemplate, setOriginalLinkedinTemplate] =
    useState("");
  const [editableTemplate, setEditableTemplate] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successStreak, setSuccessStreak] = useState(0);
  const [successDaysCompleted, setSuccessDaysCompleted] = useState(0);

  useEffect(() => {
    if (step !== "success") return;
    const colors = ["#6366f1", "#818cf8", "#34d399", "#fbbf24", "#f472b6"];
    void confetti({
      particleCount: 72,
      spread: 70,
      origin: { y: 0.68 },
      ticks: 140,
      scalar: 0.95,
      colors,
      disableForReducedMotion: true,
    });
    const t1 = window.setTimeout(() => {
      void confetti({
        particleCount: 28,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
    }, 350);
    const t2 = window.setTimeout(() => {
      void confetti({
        particleCount: 28,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
    }, 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [step]);

  async function handleGithubSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("githubUrl", githubUrl);
      fd.append("dayNumber", String(dayNumber));
      const res = await submitGithubStepAction(fd);
      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      setGithubUrl(res.githubUrl);
      setOriginalLinkedinTemplate(res.linkedinTemplate);
      setEditableTemplate(res.linkedinTemplate);
      setStep("linkedin");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLinkedinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("githubUrl", githubUrl);
      fd.append("linkedinUrl", linkedinUrl);
      fd.append("dayNumber", String(dayNumber));
      const res = await submitLinkedinStepAction(fd);
      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      setSuccessStreak(res.newStreak);
      setSuccessDaysCompleted(res.daysCompleted);
      setStep("success");
      toast.success(`Day ${dayNumber} complete!`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(editableTemplate);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  }

  const templateTooShort = editableTemplate.length < 50;

  const daysRemaining = Math.max(0, 60 - successDaysCompleted);
  const journeyPct = Math.min(100, Math.round((successDaysCompleted / 60) * 100));
  const completedDay60 = dayNumber === 60;

  if (step === "success") {
    if (completedDay60) {
      return (
        <div className="w-full space-y-10 py-4">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div
              className="flex size-28 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50"
              aria-hidden
            >
              <span className="text-6xl leading-none">🏆</span>
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                60 Day Challenge Complete!
              </h2>
              <p className="text-lg text-muted-foreground">
                You&apos;re now Ready for Interview
              </p>
              <p className="text-base text-muted-foreground">
                Recruiters can now find your profile
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 min-w-[220px] px-8 text-base font-medium",
              )}
            >
              View Your Profile
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full space-y-10 py-2">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div
            className="flex size-28 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50"
            aria-hidden
          >
            <CheckCircle2 className="size-20 text-emerald-500" strokeWidth={1.75} />
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Day {dayNumber} Complete! 🎉
            </h2>
            <p className="text-lg text-muted-foreground">
              You showed up. That&apos;s what counts.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50 p-0 shadow-sm">
            <CardContent className="space-y-3 p-8">
              <Flame
                className="size-8 text-orange-500"
                strokeWidth={2}
                aria-hidden
              />
              <p className="font-display text-4xl font-bold tabular-nums">
                {successStreak}
              </p>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Day streak
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 p-0 shadow-sm">
            <CardContent className="space-y-3 p-8">
              <CheckCircle
                className="size-8 text-emerald-500"
                strokeWidth={2}
                aria-hidden
              />
              <p className="font-display text-4xl font-bold tabular-nums">
                {successDaysCompleted}
                <span className="text-2xl font-semibold text-muted-foreground">
                  {" "}
                  / 60
                </span>
              </p>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Days completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 p-0 shadow-sm">
            <CardContent className="space-y-3 p-8">
              <Calendar
                className="size-8 text-blue-500"
                strokeWidth={2}
                aria-hidden
              />
              <p className="font-display text-4xl font-bold tabular-nums">
                {daysRemaining}
              </p>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Days to go
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-500"
              style={{ width: `${journeyPct}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {journeyPct}% of your 60-day journey
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-12 min-w-[200px] px-8 text-base font-medium",
            )}
          >
            Back to Dashboard
          </Link>
          {dayNumber < 60 ? (
            <Link
              href={`/challenge/${dayNumber + 1}`}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-12 min-w-[200px] px-8 text-base font-medium",
              )}
            >
              View Day {dayNumber + 1}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (step === "linkedin") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription>
              Step 2 of 2: Share on LinkedIn
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post text</CardTitle>
            <CardDescription>
              1. Copy this text · 2. Post it on LinkedIn · 3. Paste the post URL
              below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Textarea
                  value={editableTemplate}
                  onChange={(e) => setEditableTemplate(e.target.value)}
                  className="min-h-[200px] resize-y border-input bg-background text-sm text-foreground shadow-sm"
                  aria-label="LinkedIn post template"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 sm:mt-0"
                  onClick={() => void copyTemplate()}
                >
                  Copy to clipboard
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Feel free to edit before posting — add your own thoughts or
                personal touches
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm tabular-nums text-muted-foreground">
                  {editableTemplate.length} characters
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() =>
                    setEditableTemplate(originalLinkedinTemplate)
                  }
                >
                  Reset to original
                </Button>
              </div>
            </div>

            <form onSubmit={handleLinkedinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn post URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://www.linkedin.com/posts/…"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  autoComplete="off"
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={isSubmitting || templateTooShort}
              >
                {isSubmitting ? "Submitting…" : "Submit & complete day"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>
            Day {dayNumber} · {userDomain}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-none space-y-3 text-sm leading-relaxed whitespace-pre-wrap [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
          <ReactMarkdown>{task.problemStatement}</ReactMarkdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit your solution</CardTitle>
          <CardDescription>
            Paste the URL of your public GitHub Commit File for this day&apos;s
            work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGithubSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub Commit URL</Label>
              <Input
                id="githubUrl"
                name="githubUrl"
                type="url"
                placeholder="https://github.com/you/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                autoComplete="off"
                disabled={isSubmitting}
                aria-invalid={!!error}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Checking…" : "Validate & continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
