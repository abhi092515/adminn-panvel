import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { asyncHandler } from "../utils/asyncHandler";

export const getLoyalty = asyncHandler(async (req, res) => {
  const points = await storage.getLoyaltyPoints(req.params.customerId);
  const balance = await storage.getCustomerPointsBalance(req.params.customerId);

  const earned = points
    .filter((p) => p.type === "earned")
    .reduce((sum, p) => sum + p.points, 0);
  const redeemed = points
    .filter((p) => p.type === "redeemed")
    .reduce((sum, p) => sum + Math.abs(p.points), 0);

  res.json({
    balance,
    lifetimeEarned: earned,
    lifetimeRedeemed: redeemed,
    history: points.slice(0, 20),
  });
});

export const earnPoints = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const { points, description, bookingId } = req.body;
    if (!points || points <= 0) {
      return res.status(400).json({ message: "Points must be positive" });
    }

    const pointsRecord = await storage.createLoyaltyPoints({
      customerId: req.params.customerId,
      type: "earned",
      points,
      description: description || "Points earned",
      bookingId,
      expiresAt: null,
    });

    const balance = await storage.getCustomerPointsBalance(req.params.customerId);
    broadcast("loyalty_earned", { ...pointsRecord, balance });
    res.status(201).json({ ...pointsRecord, balance });
  });

export const redeemPoints = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const { points, description } = req.body;
    if (!points || points <= 0) {
      return res.status(400).json({ message: "Points must be positive" });
    }

    const balance = await storage.getCustomerPointsBalance(req.params.customerId);
    if (balance < points) {
      return res.status(400).json({ message: `Insufficient points. Available: ${balance}` });
    }

    const pointsRecord = await storage.createLoyaltyPoints({
      customerId: req.params.customerId,
      type: "redeemed",
      points: -points,
      description: description || "Points redeemed",
      expiresAt: null,
    });

    const newBalance = await storage.getCustomerPointsBalance(req.params.customerId);
    broadcast("loyalty_redeemed", { ...pointsRecord, balance: newBalance });
    res.status(201).json({ ...pointsRecord, balance: newBalance });
  });
