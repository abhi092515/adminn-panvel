import { Router } from "express";
import {
  listVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venuesController";
import type { BroadcastFn } from "../realtime/websocket";

export function createVenuesRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listVenues);
  router.get("/:id", getVenue);
  router.post("/", createVenue(broadcast));
  router.patch("/:id", updateVenue(broadcast));
  router.delete("/:id", deleteVenue(broadcast));
  return router;
}
