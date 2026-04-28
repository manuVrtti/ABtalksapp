"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rejectSubmissionAction } from "@/app/actions/admin-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RejectSubmissionButton({
  submissionId,
  dayNumber,
}: {
  submissionId: string;
  dayNumber: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="size-3.5" />
            Reject
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject submission</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this submission for Day {dayNumber}?
            This will delete the submission and decrement days completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={`reject-reason-${submissionId}`}>Reason (optional)</Label>
          <Textarea
            id={`reject-reason-${submissionId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const result = await rejectSubmissionAction({
                submissionId,
                reason: reason || undefined,
              });
              setPending(false);

              if (result.ok) {
                toast.success(`Rejected Day ${dayNumber} submission`);
                setOpen(false);
                router.refresh();
                return;
              }

              toast.error(result.message);
            }}
          >
            {pending ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
