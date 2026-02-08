import { storage } from "../storage";
import { asyncHandler } from "../utils/asyncHandler";

export const listMaintenanceLogs = asyncHandler(async (_req, res) => {
  const logs = await storage.getMaintenanceLogs();
  res.json(logs);
});
