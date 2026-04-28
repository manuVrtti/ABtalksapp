"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PlaceholderActionButtons() {
  const showComingSoon = () => {
    toast.info("Action coming soon", {
      description: "Admin actions will be wired up in the next update.",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={showComingSoon}>
        Mark Day Complete
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={showComingSoon}>
        Reset Progress
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={showComingSoon}>
        Toggle Ready for Interview
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={showComingSoon}>
        Remove from Challenge
      </Button>
    </div>
  );
}
