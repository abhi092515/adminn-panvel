import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertTransactionSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listTransactions = asyncHandler(async (_req, res) => {
  const transactions = await storage.getTransactions();
  res.json(transactions);
});

export const createTransaction = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertTransactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const transaction = await storage.createTransaction(result.data);
    broadcast("transaction_created", transaction);
    res.status(201).json(transaction);
  });
