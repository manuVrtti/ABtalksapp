import { prisma } from "@/lib/db";

export async function getMySynergy(userId: string): Promise<number> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { synergyPoints: true },
  });
  return profile?.synergyPoints ?? 0;
}
