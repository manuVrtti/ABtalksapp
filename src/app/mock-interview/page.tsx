import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shared/app-header";
import { getMockInterviewEligibility } from "@/features/mock-interview/check-eligibility";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function MockInterviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const eligibility = await getMockInterviewEligibility(session.user.id);

  const headerUser = {
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    role: session.user.role ?? "STUDENT",
    isAdmin: session.user.isAdmin ?? false,
  };

  let cardClass = "border-border";
  let title = "";
  let body: ReactNode = null;
  let cta: ReactNode = null;

  switch (eligibility.status) {
    case "ELIGIBLE":
      cardClass = "border-green-600/40 bg-green-50/50 dark:bg-green-950/20";
      title = "You're eligible for mock interviews.";
      body = (
        <p className="text-base leading-relaxed text-muted-foreground">
          You finished the 60-day challenge without missing a day. Our team will
          reach out to you to schedule your first mock. Make sure your profile and
          resume link are up to date.
        </p>
      );
      cta = (
        <Link
          href="/profile"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
        >
          Update profile
        </Link>
      );
      break;
    case "IN_PROGRESS":
      title = "Mock interviews unlock after 60 days.";
      body = (
        <>
          <p className="text-base leading-relaxed text-muted-foreground">
            Complete the 60-day challenge consistently — every day, without
            missing — to unlock mock interviews. You&apos;re on Day{" "}
            {eligibility.daysCompleted} of {eligibility.totalDays}.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${(eligibility.daysCompleted / eligibility.totalDays) * 100}%`,
              }}
            />
          </div>
        </>
      );
      break;
    case "MISSED_DAYS":
      cardClass = "border-amber-600/40 bg-amber-50/50 dark:bg-amber-950/20";
      title = `60 days completed — but with ${eligibility.missed} missed day${eligibility.missed === 1 ? "" : "s"}.`;
      body = (
        <p className="text-base leading-relaxed text-muted-foreground">
          Mock interviews are reserved for students who finish the challenge
          without missing a single day. You can re-enroll in a fresh track to try
          again.
        </p>
      );
      break;
    case "NO_ENROLLMENT":
      title = "Start the challenge to unlock mock interviews.";
      body = (
        <p className="text-base leading-relaxed text-muted-foreground">
          Complete the 60-day challenge consistently — every day, without
          missing — to unlock mock interviews.
        </p>
      );
      cta = (
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "default" }), "mt-6")}
        >
          Get started
        </Link>
      );
      break;
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <AppHeader user={headerUser} />
      <div className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="font-display text-xl">{title}</CardTitle>
            <CardDescription className="sr-only">
              Mock interview eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            {body}
            {cta}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
