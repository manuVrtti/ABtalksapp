"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const actions = [
  "Mark Day Complete",
  "Reset Progress",
  "Toggle Ready for Interview",
  "Remove from Challenge",
];

export function StudentActionButtons() {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.map((label) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          onClick={() => toast.info("Action coming soon")}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
