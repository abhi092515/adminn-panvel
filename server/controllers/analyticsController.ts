import { storage } from "../storage";
import { asyncHandler } from "../utils/asyncHandler";

export const getNoShowAnalytics = asyncHandler(async (_req, res) => {
  const bookings = await storage.getBookings();
  const customers = await storage.getCustomers();

  const noShowBookings = bookings.filter((b) => b.status === "no_show");
  const highRiskCustomers = customers.filter(
    (c) => c.noShowCount >= 3 || (c.tags || []).includes("HIGH_RISK"),
  );
  const repeatOffenders = customers.filter((c) => c.noShowCount >= 2);
  const blacklistedCustomers = customers.filter((c) => c.isBlacklisted);

  const completedOrNoShow = bookings.filter(
    (b) => b.status === "completed" || b.status === "no_show" || b.status === "checked_in",
  );
  const noShowRate =
    completedOrNoShow.length > 0
      ? (noShowBookings.length / completedOrNoShow.length) * 100
      : 0;

  const revenueLost = noShowBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  res.json({
    totalNoShows: noShowBookings.length,
    noShowRate: Number(noShowRate.toFixed(1)),
    revenueLost,
    highRiskCount: highRiskCustomers.length,
    repeatOffendersCount: repeatOffenders.length,
    blacklistedCount: blacklistedCustomers.length,
    recentNoShows: noShowBookings.slice(-10).reverse(),
    repeatOffenders: repeatOffenders.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      noShowCount: c.noShowCount,
      isBlacklisted: c.isBlacklisted,
      tags: c.tags,
    })),
  });
});
