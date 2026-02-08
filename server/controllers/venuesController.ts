import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertVenueSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listVenues = asyncHandler(async (_req, res) => {
  const venues = await storage.getVenues();
  res.json(venues);
});

export const getVenue = asyncHandler(async (req, res) => {
  const venue = await storage.getVenue(req.params.id);
  if (!venue) {
    return res.status(404).json({ message: "Venue not found" });
  }
  res.json(venue);
});

export const createVenue = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertVenueSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const venue = await storage.createVenue(result.data);
    broadcast("venue_created", venue);
    res.status(201).json(venue);
  });

export const updateVenue = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertVenueSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const venue = await storage.updateVenue(req.params.id, result.data);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    broadcast("venue_updated", venue);
    res.json(venue);
  });

export const deleteVenue = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteVenue(req.params.id);
    broadcast("venue_deleted", { id: req.params.id });
    res.status(204).send();
  });
