import { Router } from "express";
import {
  listCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../controllers/courtsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createCourtsRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listCourts);
  router.post("/", createCourt(broadcast));
  router.patch("/:id", updateCourt(broadcast));
  router.delete("/:id", deleteCourt(broadcast));
  return router;
}
