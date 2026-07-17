/**
 * One-shot: waive Days 1..(PROGRAM_MEMBER_START_DAY-1) and unlock start day
 * for existing ENROLLED / COMPLETED program members.
 *
 * Usage: npm run db:bootstrap:program-start-day
 *
 * Idempotent — safe to re-run.
 */
import { config } from "dotenv";
import { prisma } from "../../src/lib/db";
import { PROGRAM_MEMBER_START_DAY } from "../../src/features/program/constants";
import { bootstrapMemberStartDay } from "../../src/features/program/bootstrap-start-day";

config({ path: ".env.local" });
config();

async function main() {
  const waivedDays = Array.from(
    { length: PROGRAM_MEMBER_START_DAY - 1 },
    (_, i) => i + 1,
  );

  const members = await prisma.programMember.findMany({
    where: { status: { in: ["ENROLLED", "COMPLETED"] } },
    select: {
      id: true,
      fullName: true,
      highestUnlockedDay: true,
      missionSubmissions: {
        where: { dayNumber: { in: waivedDays }, passed: true },
        select: { dayNumber: true },
      },
    },
  });

  let updated = 0;
  for (const m of members) {
    const passedSet = new Set(m.missionSubmissions.map((s) => s.dayNumber));
    const needsBootstrap =
      m.highestUnlockedDay < PROGRAM_MEMBER_START_DAY ||
      waivedDays.some((d) => !passedSet.has(d));
    if (!needsBootstrap) continue;

    await prisma.$transaction(async (tx) => {
      await bootstrapMemberStartDay(tx, m.id);
    });
    updated += 1;
    console.log(
      `  bootstrapped ${m.fullName} (${m.id}) — was unlocked day ${m.highestUnlockedDay}`,
    );
  }

  console.log(
    `Done. Checked ${members.length} member(s); updated ${updated}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
