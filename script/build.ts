import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const skipClient = process.env.SKIP_CLIENT_BUILD === "true";
  const skipServer = process.env.SKIP_SERVER_BUILD === "true";

  if (skipClient && skipServer) {
    throw new Error("Nothing to build: both SKIP_CLIENT_BUILD and SKIP_SERVER_BUILD are true");
  }

  // Clean only what we're about to rebuild to avoid deleting an existing artifact
  if (!skipClient) {
    await rm("dist/public", { recursive: true, force: true });
  }
  if (!skipServer) {
    await rm("dist/index.cjs", { force: true });
  }

  if (!skipClient) {
    console.log("building client...");
    await viteBuild();
  } else {
    console.log("skipping client build (SKIP_CLIENT_BUILD=true)");
  }

  if (!skipServer) {
    console.log("building server...");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));

    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });
  } else {
    console.log("skipping server build (SKIP_SERVER_BUILD=true)");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
