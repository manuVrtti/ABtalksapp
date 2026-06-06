"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const applySchema = z.object({
  jobId: z.string().min(1),
  note: z.string().max(1000).optional().default(""),
});

export async function applyToJobAction(input: { jobId: string; note?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, message: "Sign in to apply." };
  }

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "Invalid input" };
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: parsed.data.jobId },
      select: { isOpen: true },
    });
    if (!job || !job.isOpen) {
      return { ok: false as const, message: "This role is closed." };
    }

    await prisma.jobApplication.create({
      data: {
        jobId: parsed.data.jobId,
        userId: session.user.id,
        note: parsed.data.note.trim() || null,
      },
    });

    return { ok: true as const };
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2002") {
      return {
        ok: false as const,
        message: "You've already applied to this role.",
      };
    }
    return { ok: false as const, message: "Application failed. Try again." };
  }
}
