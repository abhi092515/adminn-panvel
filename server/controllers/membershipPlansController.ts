import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertMembershipPlanSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listMembershipPlans = asyncHandler(async (_req, res) => {
  const plans = await storage.getMembershipPlans();
  res.json(plans);
});

export const createMembershipPlan = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertMembershipPlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const plan = await storage.createMembershipPlan(result.data);
    broadcast("membership_plan_created", plan);
    res.status(201).json(plan);
  });

export const updateMembershipPlan = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const plan = await storage.updateMembershipPlan(req.params.id, req.body);
    if (!plan) {
      return res.status(404).json({ message: "Membership plan not found" });
    }
    broadcast("membership_plan_updated", plan);
    res.json(plan);
  });

export const deleteMembershipPlan = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteMembershipPlan(req.params.id);
    broadcast("membership_plan_deleted", { id: req.params.id });
    res.status(204).send();
  });
