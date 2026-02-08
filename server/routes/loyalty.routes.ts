import { Router } from "express";
import { getLoyalty, earnPoints, redeemPoints } from "../controllers/loyaltyController";
import type { BroadcastFn } from "../realtime/websocket";

export function createLoyaltyRouter(broadcast: BroadcastFn) {
  const router = Router({ mergeParams: true });
  router.get("/:customerId/loyalty", getLoyalty);
  router.post("/:customerId/loyalty/earn", earnPoints(broadcast));
  router.post("/:customerId/loyalty/redeem", redeemPoints(broadcast));
  return router;
}
