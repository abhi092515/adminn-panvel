import { Router } from "express";
import { listMaintenanceLogs } from "../controllers/maintenanceController";

export function createMaintenanceRouter() {
  const router = Router();
  router.get("/", listMaintenanceLogs);
  return router;
}
