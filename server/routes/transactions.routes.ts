import { Router } from "express";
import { listTransactions, createTransaction } from "../controllers/transactionsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createTransactionsRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listTransactions);
  router.post("/", createTransaction(broadcast));
  return router;
}
