import { Router } from "express";
import { getNoShowAnalytics } from "../controllers/analyticsController";

export function createAnalyticsRouter() {
  const router = Router();
  router.get("/no-shows", getNoShowAnalytics);
  return router;
}
