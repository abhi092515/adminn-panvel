import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertExpenseSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listExpenses = asyncHandler(async (_req, res) => {
  const expenses = await storage.getExpenses();
  res.json(expenses);
});

export const createExpense = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertExpenseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const expense = await storage.createExpense(result.data);
    broadcast("expense_created", expense);
    res.status(201).json(expense);
  });

export const deleteExpense = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteExpense(req.params.id);
    broadcast("expense_deleted", { id: req.params.id });
    res.status(204).send();
  });
