import { Router } from "express";
import { listSettlements, getSettlementSummary } from "../controllers/settlementsController";

export function createSettlementsRouter() {
  const router = Router();
  router.get("/", listSettlements);
  router.get("/summary", getSettlementSummary);
  return router;
}
