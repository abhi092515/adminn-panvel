import { Router } from "express";
import { listWaitlist, createWaitlist, updateWaitlist } from "../controllers/waitlistController";
import type { BroadcastFn } from "../realtime/websocket";

export function createWaitlistRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listWaitlist);
  router.post("/", createWaitlist(broadcast));
  router.patch("/:id", updateWaitlist(broadcast));
  return router;
}
