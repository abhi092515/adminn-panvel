import { Router } from "express";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController";
import type { BroadcastFn } from "../realtime/websocket";

export function createCategoriesRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listCategories);
  router.get("/:id", getCategory);
  router.post("/", createCategory(broadcast));
  router.patch("/:id", updateCategory(broadcast));
  router.delete("/:id", deleteCategory(broadcast));
  return router;
}
