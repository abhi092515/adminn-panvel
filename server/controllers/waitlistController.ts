import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertWaitlistSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listWaitlist = asyncHandler(async (_req, res) => {
  const waitlistItems = await storage.getWaitlist();
  res.json(waitlistItems);
});

export const createWaitlist = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertWaitlistSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const item = await storage.createWaitlistItem(result.data);
    broadcast("waitlist_created", item);
    res.status(201).json(item);
  });

export const updateWaitlist = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const item = await storage.updateWaitlistItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ message: "Waitlist item not found" });
    }
    broadcast("waitlist_updated", item);
    res.json(item);
  });
