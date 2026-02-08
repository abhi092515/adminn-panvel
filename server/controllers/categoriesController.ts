import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertCategorySchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await storage.getCategory(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
});

export const createCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertCategorySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.message });
    const created = await storage.createCategory(result.data);
    broadcast("category_created", created);
    res.status(201).json(created);
  });

export const updateCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertCategorySchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.message });
    const updated = await storage.updateCategory(req.params.id, result.data);
    if (!updated) return res.status(404).json({ message: "Category not found" });
    broadcast("category_updated", updated);
    res.json(updated);
  });

export const deleteCategory = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteCategory(req.params.id);
    broadcast("category_deleted", { id: req.params.id });
    res.status(204).send();
  });
