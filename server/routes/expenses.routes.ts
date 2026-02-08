import { Router } from "express";
import { listExpenses, createExpense, deleteExpense } from "../controllers/expensesController";
import type { BroadcastFn } from "../realtime/websocket";

export function createExpensesRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listExpenses);
  router.post("/", createExpense(broadcast));
  router.delete("/:id", deleteExpense(broadcast));
  return router;
}
