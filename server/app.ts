import express, { type Request } from "express";
import { createServer } from "http";
import { connectDB } from "./config/db";
import { registerApiRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { log } from "./utils/logger";
import { setupSwagger } from "./config/swagger";
import { responseEnvelope } from "./middleware/responseEnvelope";

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // Keep raw body for webhooks
  app.use(
    express.json({
      verify: (req: Request, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));
  app.use(requestLogger);
  // Standardize API responses
  app.use("/api", responseEnvelope);

  await connectDB();

  await setupAuth(app);
  registerAuthRoutes(app);
  setupSwagger(app);

  registerApiRoutes(app, httpServer);

  app.use(errorHandler);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "3002", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => log(`serving on port ${port}`),
  );

  return { app, httpServer };
}
