import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertBlockedSlotSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listBlockedSlots = asyncHandler(async (_req, res) => {
  const blockedSlots = await storage.getBlockedSlots();
  res.json(blockedSlots);
});

export const createBlockedSlot = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertBlockedSlotSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const slot = await storage.createBlockedSlot(result.data);
    broadcast("blocked_slot_created", slot);
    res.status(201).json(slot);
  });

export const deleteBlockedSlot = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteBlockedSlot(req.params.id);
    broadcast("blocked_slot_deleted", { id: req.params.id });
    res.status(204).send();
  });
