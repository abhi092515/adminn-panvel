import { Router } from "express";
import {
  listMainCategories,
  getMainCategory,
  createMainCategory,
  updateMainCategory,
  deleteMainCategory,
} from "../controllers/mainCategoriesController";
import type { BroadcastFn } from "../realtime/websocket";

export function createMainCategoriesRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listMainCategories);
  router.get("/:id", getMainCategory);
  router.post("/", createMainCategory(broadcast));
  router.patch("/:id", updateMainCategory(broadcast));
  router.delete("/:id", deleteMainCategory(broadcast));
  return router;
}
