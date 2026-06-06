"use server";

import { auth } from "@/auth";
import { getMySynergy } from "@/features/synergy/get-my-synergy";

export async function getMySynergyAction(): Promise<{ points: number }> {
  const session = await auth();
  if (!session?.user?.id) return { points: 0 };
  return { points: await getMySynergy(session.user.id) };
}
