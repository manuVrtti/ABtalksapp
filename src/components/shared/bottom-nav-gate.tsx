import { Suspense } from "react";
import { auth } from "@/auth";
import { BottomNav } from "./bottom-nav";

async function BottomNavGateInner() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return <BottomNav />;
}

export function BottomNavGate() {
  return (
    <Suspense fallback={null}>
      <BottomNavGateInner />
    </Suspense>
  );
}
