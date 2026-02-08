import mongoose from "mongoose";

// Optional in-memory MongoDB for local development
let memoryServer: any;

async function resolveMongoUrl(): Promise<string> {
  const useMemory =
    process.env.USE_IN_MEMORY_DB === "true" ||
    (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production");

  if (useMemory) {
    // Lazy import to avoid bundling the binary in production
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer ??= await MongoMemoryServer.create({ instance: { port: 0 } });
    const uri = memoryServer.getUri("venue-manager");
    process.env.DATABASE_URL = uri; // keep session store in sync
    process.env.USE_IN_MEMORY_DB = "true";
    return uri;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  return process.env.DATABASE_URL;
}

export const connectDB = async () => {
  try {
    const mongoUrl = await resolveMongoUrl();
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 6000 });
    console.log(
      `MongoDB connected successfully${
        process.env.USE_IN_MEMORY_DB === "true" ? " (in-memory)" : ""
      }`,
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log("MongoDB disconnected successfully");
  } catch (err) {
    console.error("MongoDB disconnection error:", err);
    process.exit(1);
  }
};
