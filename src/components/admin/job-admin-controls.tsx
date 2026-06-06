"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  deleteJobAction,
  getJobApplicantsForExport,
  toggleJobOpenAction,
} from "@/app/actions/admin-job-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadCSV, toCSV } from "@/lib/csv";

type Props = {
  jobId: string;
  isOpen: boolean;
};

export function JobAdminControls({ jobId, isOpen }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleJobOpenAction({ jobId, isOpen: !isOpen });
      if (result.ok) {
        toast.success(isOpen ? "Job closed" : "Job reopened");
        router.refresh();
        return;
      }
      toast.error(result.message);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteJobAction({ jobId });
      if (result.ok) {
        toast.success("Job deleted");
        router.push("/admin/jobs");
        return;
      }
      toast.error(result.message);
    });
  }

  function handleExport() {
    startTransition(async () => {
      const result = await getJobApplicantsForExport(jobId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.data.length === 0) {
        toast.error("No applicants to export");
        return;
      }
      const csv = toCSV(result.data);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(`abtalks-job-${jobId}-applicants-${date}.csv`, csv);
      toast.success(`Exported ${result.data.length} applicants`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => handleToggle()}
      >
        {isOpen ? "Close job" : "Reopen job"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => handleExport()}
      >
        <Download className="mr-2 size-4" aria-hidden />
        Export applicants (CSV)
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => setDeleteOpen(true)}
      >
        Delete job
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this job?</DialogTitle>
            <DialogDescription>
              This permanently removes the job and all applications. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                handleDelete();
                setDeleteOpen(false);
              }}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
