import { Router } from "express";
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  markNoShow,
} from "../controllers/bookingsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createBookingsRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listBookings);
  router.get("/:id", getBooking);
  router.post("/", createBooking(broadcast));
  router.patch("/:id", updateBooking(broadcast));
  router.delete("/:id", deleteBooking(broadcast));
  router.post("/:id/no-show", markNoShow(broadcast));
  return router;
}
