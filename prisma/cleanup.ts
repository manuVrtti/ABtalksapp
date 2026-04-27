import { prisma } from "../src/lib/db";

async function cleanup() {
  // Get cleanup mode from command line argument
  const mode = process.argv[2] ?? "all";

  console.log(`Cleanup mode: ${mode}`);

  let whereClause: object;

  switch (mode) {
    case "test":
      // Only delete test users (@abtalks.dev)
      whereClause = { email: { endsWith: "@abtalks.dev" } };
      console.log("Deleting only @abtalks.dev test users...");
      break;

    case "real":
      // Only delete real users (everything except @abtalks.dev)
      whereClause = { email: { not: { endsWith: "@abtalks.dev" } } };
      console.log("Deleting all real users (Google OAuth users)...");
      break;

    case "all":
      // Delete EVERYTHING — for full reset
      whereClause = {};
      console.log("Deleting ALL users (test + real)...");
      break;

    default:
      console.error(`Unknown mode: ${mode}. Use 'test', 'real', or 'all'.`);
      process.exit(1);
  }

  // Confirmation prompt for safety
  if (mode === "all" || mode === "real") {
    console.log("\nWARNING: This will permanently delete user data.");
    console.log("Press Ctrl+C in the next 5 seconds to cancel...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const userCount = await prisma.user.count({ where: whereClause });
  console.log(`Found ${userCount} users matching the criteria.`);

  if (userCount === 0) {
    console.log("Nothing to delete.");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.user.deleteMany({ where: whereClause });
  console.log(`Deleted ${result.count} users (cascades handled related rows).`);
  console.log("Cleanup complete.");

  await prisma.$disconnect();
}

cleanup().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});
