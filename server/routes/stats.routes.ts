import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";

export function createStatsRouter() {
  const router = Router();
  router.get("/dashboard", getDashboardStats);
  return router;
}
