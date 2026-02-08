import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
} from "../controllers/customersController";
import type { BroadcastFn } from "../realtime/websocket";

export function createCustomersRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listCustomers);
  router.get("/:id", getCustomer);
  router.post("/", createCustomer(broadcast));
  router.patch("/:id", updateCustomer(broadcast));
  return router;
}
