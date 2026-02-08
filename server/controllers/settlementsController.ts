import { storage } from "../storage";
import type { SettlementSummary } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listSettlements = asyncHandler(async (_req, res) => {
  const settlements = await storage.getSettlements();
  res.json(settlements);
});

export const getSettlementSummary = asyncHandler(async (_req, res) => {
  const settlements = await storage.getSettlements();
  const transactions = await storage.getTransactions();

  const cashTransactions = transactions.filter(
    (t) => t.paymentMethod === "cash" && t.type === "booking_payment",
  );
  const totalCashReceived = cashTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const commissionRate = 5;
  const totalCommission = Math.round(totalCashReceived * (commissionRate / 100));

  const totalSettled = settlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const summary: SettlementSummary = {
    totalEarnings: totalCashReceived,
    totalSettled,
    amountDue: totalCommission - totalSettled,
    commissionRate,
    pendingSettlements: settlements.filter((s) => s.status === "pending"),
  };

  res.json(summary);
});
