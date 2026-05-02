"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  trigger: boolean;
  /** Path to navigate to after toast (e.g. `/dashboard` or `/dashboard?lb_domain=SE`) */
  cleanPath: string;
};

export function PastMissedChallengeToast({ trigger, cleanPath }: Props) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (!trigger || fired.current) return;
    fired.current = true;
    toast.message(
      "Past missed days cannot be submitted. View the problem from your dashboard heatmap.",
    );
    router.replace(cleanPath);
  }, [trigger, cleanPath, router]);

  return null;
}
