import { prisma } from "../src/lib/db";

async function cleanup() {
  console.log("Starting cleanup of test data...");

  // Delete all users with @abtalks.dev emails (test users)
  // Cascades will handle related rows
  const result = await prisma.user.deleteMany({
    where: {
      email: { endsWith: "@abtalks.dev" },
    },
  });

  console.log(`Deleted ${result.count} test users.`);
  console.log("Cleanup complete.");

  await prisma.$disconnect();
}

cleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});
