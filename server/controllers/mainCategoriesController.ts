import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertMainCategorySchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listMainCategories = asyncHandler(async (_req, res) => {
  const categories = await storage.getMainCategories();
  res.json(categories);
});

export const getMainCategory = asyncHandler(async (req, res) => {
  const category = await storage.getMainCategory(req.params.id);
  if (!category) return res.status(404).json({ message: "Main category not found" });
  res.json(category);
});

export const createMainCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertMainCategorySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.message });
    const created = await storage.createMainCategory(result.data);
    broadcast("main_category_created", created);
    res.status(201).json(created);
  });

export const updateMainCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertMainCategorySchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.message });
    const updated = await storage.updateMainCategory(req.params.id, result.data);
    if (!updated) return res.status(404).json({ message: "Main category not found" });
    broadcast("main_category_updated", updated);
    res.json(updated);
  });

export const deleteMainCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteMainCategory(req.params.id);
    broadcast("main_category_deleted", { id: req.params.id });
    res.status(204).send();
  });
