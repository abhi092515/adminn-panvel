import type { Express } from "express";
import type { Server } from "http";
import { setupWebsocket } from "../realtime/websocket";
import { createCourtsRouter } from "./courts.routes";
import { createCustomersRouter } from "./customers.routes";
import { createBookingsRouter } from "./bookings.routes";
import { createAnalyticsRouter } from "./analytics.routes";
import { createTransactionsRouter } from "./transactions.routes";
import { createSettlementsRouter } from "./settlements.routes";
import { createWaitlistRouter } from "./waitlist.routes";
import { createBlockedSlotsRouter } from "./blockedSlots.routes";
import { createTournamentsRouter } from "./tournaments.routes";
import { createExpensesRouter } from "./expenses.routes";
import { createMaintenanceRouter } from "./maintenance.routes";
import { createStaffRouter } from "./staff.routes";
import { createMembershipPlansRouter } from "./membershipPlans.routes";
import { createMembershipsRouter } from "./memberships.routes";
import { createLoyaltyRouter } from "./loyalty.routes";
import { createStatsRouter } from "./stats.routes";
import { createVenuesRouter } from "./venues.routes";
import { createMainCategoriesRouter } from "./mainCategories.routes";
import { createCategoriesRouter } from "./categories.routes";
import slottingRouter from "./slotting.routes";
import { seedData } from "../seedData";

export function registerApiRoutes(app: Express, httpServer: Server) {
  const { broadcast } = setupWebsocket(httpServer);

  if (process.env.SEED_ON_BOOT === "true") {
    seedData().then((counts) => {
      console.log("Seeded on boot", counts);
    }).catch((err) => console.error("Seed on boot failed", err));
  }

  app.use("/api/stats", createStatsRouter());
  app.use("/api/courts", createCourtsRouter(broadcast));
  app.use("/api/customers", createCustomersRouter(broadcast));
  app.use("/api/bookings", createBookingsRouter(broadcast));
  app.use("/api/analytics", createAnalyticsRouter());
  app.use("/api/transactions", createTransactionsRouter(broadcast));
  app.use("/api/settlements", createSettlementsRouter());
  app.use("/api/waitlist", createWaitlistRouter(broadcast));
  app.use("/api/blocked-slots", createBlockedSlotsRouter(broadcast));
  app.use("/api/tournaments", createTournamentsRouter(broadcast));
  app.use("/api/expenses", createExpensesRouter(broadcast));
  app.use("/api/maintenance", createMaintenanceRouter());
  app.use("/api/staff", createStaffRouter(broadcast));
  app.use("/api/membership-plans", createMembershipPlansRouter(broadcast));
  app.use("/api", createMembershipsRouter(broadcast));
  app.use("/api/customers", createLoyaltyRouter(broadcast));
  app.use("/api/venues", createVenuesRouter(broadcast));
  app.use("/api/main-categories", createMainCategoriesRouter(broadcast));
  app.use("/api/categories", createCategoriesRouter(broadcast));
  app.use("/api", slottingRouter);
}
