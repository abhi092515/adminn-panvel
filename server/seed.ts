import { connectDB, disconnectDB } from "./db";
import { seedData } from "./seedData";

(async () => {
  try {
    await connectDB();
    console.log("Connected to DB for seeding...");
    const counts = await seedData();
    console.log("Seeding complete!", counts);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
})();
