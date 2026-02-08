import { Router } from "express";
import {
  listMemberships,
  getCustomerMembership,
  createMembership,
  updateMembership,
} from "../controllers/membershipsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createMembershipsRouter(broadcast: BroadcastFn) {
  const router = Router();
  // Mounted at /api
  router.get("/memberships", listMemberships);
  router.get("/customers/:customerId/membership", getCustomerMembership);
  router.post("/memberships", createMembership(broadcast));
  router.patch("/memberships/:id", updateMembership(broadcast));
  return router;
}
