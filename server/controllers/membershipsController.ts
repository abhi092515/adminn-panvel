import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertMembershipSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listMemberships = asyncHandler(async (_req, res) => {
  const memberships = await storage.getMemberships();
  const plans = await storage.getMembershipPlans();
  const planMap = new Map(plans.map((p) => [p.id, p]));
  const enriched = memberships.map((m) => ({ ...m, plan: planMap.get(m.planId) }));
  res.json(enriched);
});

export const getCustomerMembership = asyncHandler(async (req, res) => {
  const membership = await storage.getActiveMembership(req.params.customerId);
  if (!membership) {
    return res.json(null);
  }
  const plan = await storage.getMembershipPlan(membership.planId);
  res.json({ ...membership, plan });
});

export const createMembership = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertMembershipSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    const customer = await storage.getCustomer(result.data.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const plan = await storage.getMembershipPlan(result.data.planId);
    if (!plan) {
      return res.status(404).json({ message: "Membership plan not found" });
    }

    const membership = await storage.createMembership(result.data);

    if (!(customer.tags || []).includes("VIP")) {
      const updatedCustomer = await storage.updateCustomer(customer.id, {
        tags: [...(customer.tags || []), "VIP"],
      } as any);
      if (updatedCustomer) {
        broadcast("customer_updated", updatedCustomer);
      }
    }

    const pointsEarned = Math.floor(Number(result.data.paidAmount) / 100) * 10;
    if (pointsEarned > 0) {
      const loyaltyRecord = await storage.createLoyaltyPoints({
        customerId: result.data.customerId,
        type: "earned",
        points: pointsEarned,
        description: `Membership purchase: ${plan.name}`,
        expiresAt: null,
      });
      broadcast("loyalty_earned", { ...loyaltyRecord, balance: pointsEarned });
    }

    broadcast("membership_created", { ...membership, plan });
    res.status(201).json({ ...membership, plan, pointsEarned });
  });

export const updateMembership = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const membership = await storage.updateMembership(req.params.id, req.body);
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }
    broadcast("membership_updated", membership);
    res.json(membership);
  });
