"use server";

import { auth } from "@/auth";
import { createClaudeEnrollment } from "@/features/enrollment/create-claude-enrollment";
import { isClaudeEnabled } from "@/lib/feature-flags";
import { revalidatePath } from "next/cache";

export async function enrollInClaudeChallenge() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, message: "Not authenticated" };
  }

  if (!isClaudeEnabled()) {
    return {
      ok: false as const,
      message: "The Claude challenge is not available yet.",
    };
  }

  const result = await createClaudeEnrollment(session.user.id);
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}
