import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { asyncHandler } from "../utils/asyncHandler";

export const listStaff = asyncHandler(async (_req, res) => {
  const staff = await storage.getStaff();
  res.json(staff);
});

export const updateStaffRole = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role || !["owner", "manager", "receptionist"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const updatedUser = await storage.updateStaffRole(req.params.id, role);
    if (!updatedUser) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    broadcast("staff_role_updated", updatedUser);
    res.json(updatedUser);
  });
