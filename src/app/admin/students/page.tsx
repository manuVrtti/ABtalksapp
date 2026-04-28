import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentsFilters } from "@/components/admin/students-filters";
import { formatDateIST } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getStudents } from "@/features/admin/get-students";

function domainBadgeClass(domain: string): string {
  if (domain === "AI") return "border-domains-ai/50 bg-domains-ai-bg text-domains-ai";
  if (domain === "DS") return "border-domains-ds/50 bg-domains-ds-bg text-domains-ds";
  return "border-domains-se/50 bg-domains-se-bg text-domains-se";
}

function statusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (status === "COMPLETED") return "bg-violet-100 text-violet-700";
  return "bg-muted text-muted-foreground";
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; domain?: "AI" | "DS" | "SE" | "ALL"; status?: "ALL" | "ACTIVE" | "COMPLETED" }>;
}) {
  const sp = await searchParams;
  const students = await getStudents({
    search: sp.q,
    domain: sp.domain ?? "ALL",
    status: sp.status ?? "ALL",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Students</h1>
        <p className="text-sm text-muted-foreground">Showing up to 100 students</p>
      </div>

      <StudentsFilters />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.userId}>
                <TableCell>
                  <Link href={`/admin/students/${student.userId}`} className="font-medium underline">
                    {student.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={domainBadgeClass(student.domain)}>
                    {student.domain}
                  </Badge>
                </TableCell>
                <TableCell>{student.daysCompleted}</TableCell>
                <TableCell>{student.currentStreak}</TableCell>
                <TableCell>
                  <Badge className={cn("border-0", statusBadgeClass(student.status))}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateIST(student.joinedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
