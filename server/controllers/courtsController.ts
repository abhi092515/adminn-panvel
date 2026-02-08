import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertCourtSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listCourts = asyncHandler(async (_req, res) => {
  const courts = await storage.getCourts();
  res.json(courts);
});

export const createCourt = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertCourtSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const court = await storage.createCourt(result.data);
    broadcast("court_created", court);
    res.status(201).json(court);
  });

export const updateCourt = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const court = await storage.updateCourt(req.params.id, req.body);
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }
    broadcast("court_updated", court);
    res.json(court);
  });

export const deleteCourt = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteCourt(req.params.id);
    broadcast("court_deleted", { id: req.params.id });
    res.status(204).send();
  });
