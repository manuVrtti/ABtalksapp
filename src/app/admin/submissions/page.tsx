import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SubmissionsFilters } from "@/components/admin/submissions-filters";
import { formatDateTimeIST } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getSubmissionsFeed } from "@/features/admin/get-submissions-feed";

function domainBadgeClass(domain: string): string {
  if (domain === "AI") return "border-domains-ai/50 bg-domains-ai-bg text-domains-ai";
  if (domain === "DS") return "border-domains-ds/50 bg-domains-ds-bg text-domains-ds";
  return "border-domains-se/50 bg-domains-se-bg text-domains-se";
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; status?: "ALL" | "ON_TIME" | "LATE"; minDay?: string; maxDay?: string }>;
}) {
  const sp = await searchParams;
  const rows = await getSubmissionsFeed({
    domain: sp.domain ?? "ALL",
    status: sp.status ?? "ALL",
  });
  const minDay = Number(sp.minDay ?? "") || 1;
  const maxDay = Number(sp.maxDay ?? "") || 60;
  const filtered = rows.filter((row) => row.dayNumber >= minDay && row.dayNumber <= maxDay);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Submissions Feed</h1>
        <p className="text-sm text-muted-foreground">Most recent 100 submissions</p>
      </div>

      <SubmissionsFilters />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>LinkedIn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTimeIST(row.submittedAt)}</TableCell>
                <TableCell>
                  <Link href={`/admin/students/${row.userId}`} className="underline">
                    {row.studentName}
                  </Link>
                </TableCell>
                <TableCell>{row.dayNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={domainBadgeClass(row.domain)}>
                    {row.domain}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border-0",
                      row.status === "ON_TIME"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <a
                    href={row.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline"
                  >
                    Open <ExternalLink className="size-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <a
                    href={row.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline"
                  >
                    Open <ExternalLink className="size-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
