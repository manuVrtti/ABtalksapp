import {
  Briefcase,
  Code2,
  Layers,
  LineChart,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const audiences = [
  { icon: Code2, label: "Engineers" },
  { icon: LineChart, label: "Data Professionals" },
  { icon: Briefcase, label: "PMs" },
  { icon: Layers, label: "Architects" },
  { icon: Users, label: "Consultants" },
] as const;

type Props = {
  compact?: boolean;
};

export function WhoThisIsFor({ compact = false }: Props) {
  return (
    <section className={cn("px-4", compact ? "py-4 md:py-6" : "py-16")}>
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Who This Is For
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          USA-based working professionals serious about AI careers.
        </p>

        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3",
            compact ? "mt-6" : "mt-10",
          )}
        >
          {audiences.map(({ icon: Icon, label }) => (
            <Badge
              key={label}
              variant="secondary"
              className="gap-2 px-4 py-2 text-sm font-normal"
            >
              <Icon className="size-4 text-primary" aria-hidden />
              {label}
            </Badge>
          ))}
        </div>

        <p
          className={cn(
            "mx-auto max-w-xl text-sm text-muted-foreground",
            compact ? "mt-6" : "mt-8",
          )}
        >
          Whether you&apos;re a software engineer looking to pivot, a data
          professional deepening your ML skills, or a PM or architect driving AI
          adoption — this cohort is built for professionals ready to commit and
          ship real AI work.
        </p>
      </div>
    </section>
  );
}
