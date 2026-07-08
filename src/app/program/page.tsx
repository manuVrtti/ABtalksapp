import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  Database,
  Network,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "AI Mastery Program — ABTalks",
  description:
    "A 30-day, hands-on AI engineering program for working professionals. Build real systems, get AI-graded, and become discoverable to recruiters.",
};

const modules = [
  {
    number: 1,
    title: "Data & Knowledge Engineering",
    subtitle: "Kafka · Vector DBs · Neo4j · RAG",
    Icon: Database,
  },
  {
    number: 2,
    title: "APIs & Microservices",
    subtitle: "FastAPI · GraphQL · gRPC · Docker · Kubernetes",
    Icon: Boxes,
  },
  {
    number: 3,
    title: "LLM & Agentic Development",
    subtitle: "OpenAI · Anthropic · LangGraph · CrewAI",
    Icon: BrainCircuit,
  },
  {
    number: 4,
    title: "MCP & Enterprise Adoption",
    subtitle: "Model Context Protocol · Capstone build",
    Icon: Network,
  },
];

const steps = [
  { n: 1, label: "Apply", detail: "Share your professional profile." },
  {
    n: 2,
    label: "Entry assessment",
    detail: "A timed aptitude + technical check.",
  },
  {
    n: 3,
    label: "30 days of missions",
    detail: "Hands-on builds verified like CI.",
  },
  {
    n: 4,
    label: "AI interview",
    detail: "A real-time voice interview to close it out.",
  },
  {
    n: 5,
    label: "Recruiter visibility",
    detail: "Ranked profile + your build portfolio.",
  },
];

export default function ProgramLandingPage() {
  return (
    <main className="flex min-h-svh flex-col bg-gradient-to-br from-primary/5 via-background to-background">
      <section className="container mx-auto flex flex-col items-center px-6 pt-20 pb-12 text-center md:pt-28">
        <span className="mb-4 inline-flex items-center rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          For professionals · 2–7 years experience
        </span>
        <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          AI Mastery Program
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          A 30-day, hands-on AI engineering program. Ship real systems across
          four modules, get your work verified like CI and graded by AI, then
          become discoverable to recruiters.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/program/apply"
            className={cn(buttonVariants({ size: "lg" }), "px-6")}
          >
            Apply now
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/talent/register"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "px-6",
            )}
          >
            I&apos;m a recruiter
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <h2 className="font-display mb-8 text-center text-2xl font-semibold tracking-tight md:text-3xl">
          Four modules, thirty days
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <Card key={m.number} className="border-border/60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <m.Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Module {m.number}
                    </p>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{m.subtitle}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <h2 className="font-display mb-8 text-center text-2xl font-semibold tracking-tight md:text-3xl">
          How it works
        </h2>
        <ol className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-xl border border-border/60 bg-card/50 p-4"
            >
              <div className="mb-2 flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {s.n}
              </div>
              <p className="font-medium">{s.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container mx-auto px-6 pt-8 pb-24 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card/50 p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Ready to build?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Free for participants. One batch at a time — apply while enrollment
            is open.
          </p>
          <Link
            href="/program/apply"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 px-6")}
          >
            Apply now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
