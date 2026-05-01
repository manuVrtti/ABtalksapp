import { seedTestUsers } from "./seed";

seedTestUsers()
  .then(() => {
    console.log("Test users seed completed");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Test users seed failed:", e);
    process.exit(1);
  });
