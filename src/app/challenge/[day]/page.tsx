import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getDayData } from "@/features/challenge/get-day-data";
import { formatDateIST } from "@/lib/date-utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmissionFlow } from "./submission-flow";

type PageProps = { params: Promise<{ day: string }> };

export default async function ChallengeDayPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { day: dayParam } = await params;
  const day = Number.parseInt(dayParam, 10);
  if (!Number.isFinite(day) || day < 1 || day > 60) {
    notFound();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (!enrollment) {
    redirect("/dashboard");
  }

  const data = await getDayData(session.user.id, day);

  if (!data) {
    return (
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Day not available</CardTitle>
            <CardDescription>
              We couldn&apos;t load this day&apos;s challenge. If the problem
              persists, contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data.isUnlocked) {
    return (
      <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Day {day} is not yet unlocked</CardTitle>
            <CardDescription>
              You are on day {data.currentDayNumber} (IST calendar from your
              start date).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              href={`/challenge/${data.currentDayNumber}`}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Go to today&apos;s challenge
            </Link>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.existingSubmission) {
    const sub = data.existingSubmission;
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{data.task.title}</CardTitle>
            <CardDescription>
              You completed this day on {formatDateIST(sub.submittedAt)} ·
              Status: {sub.status === "ON_TIME" ? "On time" : "Late"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">GitHub</p>
              <a
                href={sub.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                {sub.githubUrl}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">LinkedIn</p>
              <a
                href={sub.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                {sub.linkedinUrl}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Dashboard
        </Link>
        <p className="text-sm text-muted-foreground">
          Today (IST): day {data.currentDayNumber}
        </p>
      </div>
      <SubmissionFlow
        dayNumber={day}
        task={{
          title: data.task.title,
          problemStatement: data.task.problemStatement,
        }}
        userDomain={data.enrollment.domain}
      />
    </div>
  );
}
