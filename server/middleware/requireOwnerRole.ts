import { storage } from "../storage";
import type { RequestHandler } from "express";

export const requireOwnerRole: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated?.() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const currentUser = await storage.getUser(req.user.claims.sub);
  if (!currentUser || currentUser.role !== "owner") {
    return res.status(403).json({ message: "Forbidden - Owner access required" });
  }
  next();
};
