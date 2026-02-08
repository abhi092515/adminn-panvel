import { Router } from "express";
import {
  listBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
} from "../controllers/blockedSlotsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createBlockedSlotsRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listBlockedSlots);
  router.post("/", createBlockedSlot(broadcast));
  router.delete("/:id", deleteBlockedSlot(broadcast));
  return router;
}
