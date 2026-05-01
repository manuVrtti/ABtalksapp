import { seedContent } from "./seed";

seedContent()
  .then(() => {
    console.log("Content seed completed");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Content seed failed:", e);
    process.exit(1);
  });
