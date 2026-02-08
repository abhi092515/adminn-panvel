import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertCustomerSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await storage.getCustomers();
  res.json(customers);
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await storage.getCustomer(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
});

export const createCustomer = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    const existing = await storage.getCustomerByPhone(result.data.phone);
    if (existing) {
      return res.status(409).json({ message: "Customer with this phone already exists" });
    }

    const customer = await storage.createCustomer(result.data);
    broadcast("customer_created", customer);
    res.status(201).json(customer);
  });

export const updateCustomer = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const customer = await storage.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    broadcast("customer_updated", customer);
    res.json(customer);
  });
