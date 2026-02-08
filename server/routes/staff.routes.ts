import { Router } from "express";
import { listStaff, updateStaffRole } from "../controllers/staffController";
import type { BroadcastFn } from "../realtime/websocket";
import { requireOwnerRole } from "../middleware/requireOwnerRole";

export function createStaffRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", requireOwnerRole, listStaff);
  router.patch("/:id/role", requireOwnerRole, updateStaffRole(broadcast));
  return router;
}
