import { Router } from "express";
import {
  listMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from "../controllers/membershipPlansController";
import type { BroadcastFn } from "../realtime/websocket";
import { requireOwnerRole } from "../middleware/requireOwnerRole";

export function createMembershipPlansRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listMembershipPlans);
  router.post("/", requireOwnerRole, createMembershipPlan(broadcast));
  router.patch("/:id", requireOwnerRole, updateMembershipPlan(broadcast));
  router.delete("/:id", requireOwnerRole, deleteMembershipPlan(broadcast));
  return router;
}
