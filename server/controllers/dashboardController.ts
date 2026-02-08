import { storage } from "../storage";
import type { DashboardStats } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const [allBookings, courts, customers] = await Promise.all([
    storage.getBookings(),
    storage.getCourts(),
    storage.getCustomers(),
  ]);

  const todayBookings = allBookings.filter((b) => b.date === today);
  const todayRevenue = todayBookings.reduce(
    (sum, b) => sum + Number(b.paidAmount || 0),
    0,
  );
  const pendingCheckIns = todayBookings.filter((b) => b.status === "confirmed").length;
  const pendingPayments = allBookings.filter(
    (b) => b.paymentStatus === "pending" || b.paymentStatus === "partial",
  ).length;

  const weeklyRevenue: DashboardStats["weeklyRevenue"] = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayBookings = allBookings.filter((b) => b.date === dateStr);
    const revenue = dayBookings.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);
    weeklyRevenue.push({ day: days[date.getDay()], revenue });
  }

  const stats: DashboardStats = {
    totalBookingsToday: todayBookings.length,
    totalRevenueToday: todayRevenue,
    occupiedCourts: courts.filter((c) => c.isActive).length,
    totalCourts: courts.length,
    pendingCheckIns,
    pendingPayments,
    weeklyRevenue,
    peakHours: [],
  };

  res.json(stats);
});
