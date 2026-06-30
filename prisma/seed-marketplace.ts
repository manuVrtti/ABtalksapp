import { prisma } from "../src/lib/db";
import { seedMarketplaceItems } from "./seed";

seedMarketplaceItems()
  .then(() => {
    console.log("Marketplace seed completed");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Marketplace seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
