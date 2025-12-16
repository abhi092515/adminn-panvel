import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertCourtSchema, insertCustomerSchema, insertBookingSchema,
  insertTransactionSchema, insertWaitlistSchema, insertBlockedSlotSchema,
  insertTournamentSchema, insertTournamentTeamSchema, insertTournamentMatchSchema, insertExpenseSchema,
  insertMembershipPlanSchema, insertMembershipSchema, insertLoyaltyPointsSchema,
  type DashboardStats, type SettlementSummary,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcast = (type: string, payload: unknown) => {
    const message = JSON.stringify({ type, payload });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // WhatsApp notification stubs (integrate with WhatsApp Business API in production)
  // Using WhatsApp instead of email/SMS per requirements
  const sendWhatsAppNotification = async (phone: string, template: string, data: Record<string, unknown>) => {
    // Stub: In production, integrate with WhatsApp Business API or Twilio WhatsApp
    console.log(`[WhatsApp Notification] To: ${phone}, Template: ${template}`, data);
    
    // Return mock response for now
    return {
      success: true,
      messageId: `wa_${Date.now()}`,
      template,
      phone,
    };
  };

  const sendBookingConfirmation = async (phone: string, bookingDetails: {
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    courtName?: string;
    amount: number;
    qrCode?: string;
  }) => {
    return sendWhatsAppNotification(phone, "booking_confirmation", {
      ...bookingDetails,
      message: `Your booking is confirmed for ${bookingDetails.date} at ${bookingDetails.startTime}. Your booking ID: ${bookingDetails.bookingId.slice(0, 8).toUpperCase()}`,
    });
  };

  const sendPaymentReminder = async (phone: string, paymentDetails: {
    bookingId: string;
    amount: number;
    dueDate: string;
    paymentLink?: string;
  }) => {
    return sendWhatsAppNotification(phone, "payment_reminder", {
      ...paymentDetails,
      message: `Payment reminder: ₹${paymentDetails.amount} due for booking #${paymentDetails.bookingId.slice(0, 8).toUpperCase()}`,
    });
  };

  const sendSlotReminder = async (phone: string, reminderDetails: {
    bookingId: string;
    date: string;
    startTime: string;
    courtName?: string;
  }) => {
    return sendWhatsAppNotification(phone, "slot_reminder", {
      ...reminderDetails,
      message: `Reminder: Your slot is coming up in 1 hour at ${reminderDetails.startTime}`,
    });
  };

  const sendWaitlistNotification = async (phone: string, slotDetails: {
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    return sendWhatsAppNotification(phone, "waitlist_available", {
      ...slotDetails,
      message: `Good news! A slot is now available on ${slotDetails.date} at ${slotDetails.startTime}. Book now before it's gone!`,
    });
  };

  const sendNoShowWarning = async (phone: string, noShowCount: number) => {
    let warningLevel = "warning";
    let consequence = "";
    
    if (noShowCount >= 5) {
      warningLevel = "blacklisted";
      consequence = "Your account has been restricted due to multiple no-shows.";
    } else if (noShowCount >= 3) {
      warningLevel = "high_risk";
      consequence = `You have ${5 - noShowCount} more no-shows before your account is restricted.`;
    } else {
      consequence = "Please make sure to show up for your future bookings.";
    }
    
    return sendWhatsAppNotification(phone, "no_show_warning", {
      noShowCount,
      warningLevel,
      message: `Notice: You have ${noShowCount} recorded no-show(s). ${consequence}`,
    });
  };

  // Dashboard stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [allBookings, courts, customers] = await Promise.all([
        storage.getBookings(),
        storage.getCourts(),
        storage.getCustomers(),
      ]);

      const todayBookings = allBookings.filter((b) => b.date === today);
      const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);
      const pendingCheckIns = todayBookings.filter((b) => b.status === "confirmed").length;
      const pendingPayments = allBookings.filter((b) => b.paymentStatus === "pending" || b.paymentStatus === "partial").length;

      // Weekly revenue
      const weeklyRevenue = [];
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
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Courts
  app.get("/api/courts", async (req, res) => {
    try {
      const courts = await storage.getCourts();
      res.json(courts);
    } catch (error) {
      console.error("Error getting courts:", error);
      res.status(500).json({ message: "Failed to get courts" });
    }
  });

  app.post("/api/courts", async (req, res) => {
    try {
      const result = insertCourtSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const court = await storage.createCourt(result.data);
      broadcast("court_created", court);
      res.status(201).json(court);
    } catch (error) {
      console.error("Error creating court:", error);
      res.status(500).json({ message: "Failed to create court" });
    }
  });

  app.patch("/api/courts/:id", async (req, res) => {
    try {
      const court = await storage.updateCourt(req.params.id, req.body);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      broadcast("court_updated", court);
      res.json(court);
    } catch (error) {
      console.error("Error updating court:", error);
      res.status(500).json({ message: "Failed to update court" });
    }
  });

  app.delete("/api/courts/:id", async (req, res) => {
    try {
      await storage.deleteCourt(req.params.id);
      broadcast("court_deleted", { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting court:", error);
      res.status(500).json({ message: "Failed to delete court" });
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error getting customers:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error getting customer:", error);
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const result = insertCustomerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      // Check if customer with phone already exists
      const existing = await storage.getCustomerByPhone(result.data.phone);
      if (existing) {
        return res.status(409).json({ message: "Customer with this phone already exists" });
      }
      
      const customer = await storage.createCustomer(result.data);
      broadcast("customer_created", customer);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      broadcast("customer_updated", customer);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const { date } = req.query;
      const bookings = date 
        ? await storage.getBookingsByDate(date as string)
        : await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error getting bookings:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error getting booking:", error);
      res.status(500).json({ message: "Failed to get booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const result = insertBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      // Calculate duration if not provided
      const data = { ...result.data };
      if (!data.duration && data.startTime && data.endTime) {
        const [startHour, startMin] = data.startTime.split(":").map(Number);
        const [endHour, endMin] = data.endTime.split(":").map(Number);
        data.duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      }
      
      const booking = await storage.createBooking(data);
      
      // Create transaction if payment was made
      if (data.paidAmount && Number(data.paidAmount) > 0) {
        await storage.createTransaction({
          bookingId: booking.id,
          customerId: booking.customerId,
          type: "booking_payment",
          amount: data.paidAmount,
          paymentMethod: data.paymentMethod || "cash",
          status: "completed",
        });
      }
      
      // Send WhatsApp booking confirmation
      const customer = await storage.getCustomer(booking.customerId);
      if (customer?.phone) {
        await sendBookingConfirmation(customer.phone, {
          bookingId: booking.id,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          amount: Number(booking.totalAmount),
          qrCode: booking.qrCode || undefined,
        });
      }
      
      broadcast("booking_created", booking);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      broadcast("booking_updated", booking);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      broadcast("booking_deleted", { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // No-show tracking endpoint
  app.post("/api/bookings/:id/no-show", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.status === "no_show") {
        return res.status(400).json({ message: "Booking already marked as no-show" });
      }
      
      // Validate customer exists - bookings must have valid customers for tracking
      const customer = await storage.getCustomer(booking.customerId);
      if (!customer) {
        // Still mark booking as no-show even if customer is missing
        const updatedBooking = await storage.updateBooking(req.params.id, { status: "no_show" });
        broadcast("booking_updated", updatedBooking);
        return res.json({ 
          booking: updatedBooking, 
          noShowCount: 0,
          isHighRisk: false,
          isBlacklisted: false,
          warning: "Customer record not found - no-show tracking not applied",
        });
      }
      
      // Update booking status to no_show
      const updatedBooking = await storage.updateBooking(req.params.id, { status: "no_show" });
      
      // Calculate new metrics
      const newNoShowCount = customer.noShowCount + 1;
      const updatedTags = [...new Set([...customer.tags])];
      
      // Auto-tag HIGH_RISK after 3 no-shows
      const isHighRisk = newNoShowCount >= 3;
      if (isHighRisk && !updatedTags.includes("HIGH_RISK")) {
        updatedTags.push("HIGH_RISK");
      }
      
      // Auto-blacklist after 5 no-shows
      const isBlacklisted = newNoShowCount >= 5;
      const shouldBlacklist = isBlacklisted || customer.isBlacklisted;
      
      // Update customer with new metrics
      const updatedCustomer = await storage.updateCustomer(booking.customerId, { 
        noShowCount: newNoShowCount,
        tags: updatedTags,
        isBlacklisted: shouldBlacklist,
      });
      
      if (updatedCustomer) {
        broadcast("customer_updated", updatedCustomer);
      }
      
      // Send warning for repeat offenders
      if (newNoShowCount >= 2 && customer.phone) {
        await sendNoShowWarning(customer.phone, newNoShowCount);
      }
      
      broadcast("booking_updated", updatedBooking);
      res.json({ 
        booking: updatedBooking, 
        noShowCount: newNoShowCount,
        isHighRisk,
        isBlacklisted,
        customerName: customer.name,
      });
    } catch (error) {
      console.error("Error marking no-show:", error);
      res.status(500).json({ message: "Failed to mark no-show" });
    }
  });

  // Get no-show analytics
  app.get("/api/analytics/no-shows", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const customers = await storage.getCustomers();
      
      const noShowBookings = bookings.filter(b => b.status === "no_show");
      const highRiskCustomers = customers.filter(c => c.noShowCount >= 3 || c.tags.includes("HIGH_RISK"));
      const repeatOffenders = customers.filter(c => c.noShowCount >= 2);
      const blacklistedCustomers = customers.filter(c => c.isBlacklisted);
      
      // Calculate no-show rate
      const completedOrNoShow = bookings.filter(b => 
        b.status === "completed" || b.status === "no_show" || b.status === "checked_in"
      );
      const noShowRate = completedOrNoShow.length > 0 
        ? (noShowBookings.length / completedOrNoShow.length) * 100 
        : 0;
      
      // Revenue lost to no-shows
      const revenueLost = noShowBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      
      res.json({
        totalNoShows: noShowBookings.length,
        noShowRate: Number(noShowRate.toFixed(1)),
        revenueLost,
        highRiskCount: highRiskCustomers.length,
        repeatOffendersCount: repeatOffenders.length,
        blacklistedCount: blacklistedCustomers.length,
        recentNoShows: noShowBookings.slice(-10).reverse(),
        repeatOffenders: repeatOffenders.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          noShowCount: c.noShowCount,
          isBlacklisted: c.isBlacklisted,
          tags: c.tags,
        })),
      });
    } catch (error) {
      console.error("Error getting no-show analytics:", error);
      res.status(500).json({ message: "Failed to get no-show analytics" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const transaction = await storage.createTransaction(result.data);
      broadcast("transaction_created", transaction);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Settlements
  app.get("/api/settlements", async (req, res) => {
    try {
      const settlements = await storage.getSettlements();
      res.json(settlements);
    } catch (error) {
      console.error("Error getting settlements:", error);
      res.status(500).json({ message: "Failed to get settlements" });
    }
  });

  app.get("/api/settlements/summary", async (req, res) => {
    try {
      const settlements = await storage.getSettlements();
      const transactions = await storage.getTransactions();
      
      const cashTransactions = transactions.filter(
        (t) => t.paymentMethod === "cash" && t.type === "booking_payment"
      );
      const totalCashReceived = cashTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const commissionRate = 5;
      const totalCommission = Math.round(totalCashReceived * (commissionRate / 100));
      
      const totalSettled = settlements
        .filter((s) => s.status === "paid")
        .reduce((sum, s) => sum + Number(s.amount), 0);
      
      const summary: SettlementSummary = {
        totalEarnings: totalCashReceived,
        totalSettled,
        amountDue: totalCommission - totalSettled,
        commissionRate,
        pendingSettlements: settlements.filter((s) => s.status === "pending"),
      };
      
      res.json(summary);
    } catch (error) {
      console.error("Error getting settlement summary:", error);
      res.status(500).json({ message: "Failed to get settlement summary" });
    }
  });

  // Waitlist
  app.get("/api/waitlist", async (req, res) => {
    try {
      const waitlistItems = await storage.getWaitlist();
      res.json(waitlistItems);
    } catch (error) {
      console.error("Error getting waitlist:", error);
      res.status(500).json({ message: "Failed to get waitlist" });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const result = insertWaitlistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const item = await storage.createWaitlistItem(result.data);
      broadcast("waitlist_created", item);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating waitlist item:", error);
      res.status(500).json({ message: "Failed to create waitlist item" });
    }
  });

  app.patch("/api/waitlist/:id", async (req, res) => {
    try {
      const item = await storage.updateWaitlistItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Waitlist item not found" });
      }
      broadcast("waitlist_updated", item);
      res.json(item);
    } catch (error) {
      console.error("Error updating waitlist item:", error);
      res.status(500).json({ message: "Failed to update waitlist item" });
    }
  });

  // Blocked Slots
  app.get("/api/blocked-slots", async (req, res) => {
    try {
      const blockedSlots = await storage.getBlockedSlots();
      res.json(blockedSlots);
    } catch (error) {
      console.error("Error getting blocked slots:", error);
      res.status(500).json({ message: "Failed to get blocked slots" });
    }
  });

  app.post("/api/blocked-slots", async (req, res) => {
    try {
      const result = insertBlockedSlotSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const slot = await storage.createBlockedSlot(result.data);
      broadcast("blocked_slot_created", slot);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating blocked slot:", error);
      res.status(500).json({ message: "Failed to create blocked slot" });
    }
  });

  app.delete("/api/blocked-slots/:id", async (req, res) => {
    try {
      await storage.deleteBlockedSlot(req.params.id);
      broadcast("blocked_slot_deleted", { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blocked slot:", error);
      res.status(500).json({ message: "Failed to delete blocked slot" });
    }
  });

  // Tournaments
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error getting tournaments:", error);
      res.status(500).json({ message: "Failed to get tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error getting tournament:", error);
      res.status(500).json({ message: "Failed to get tournament" });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    try {
      const result = insertTournamentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const tournament = await storage.createTournament(result.data);
      broadcast("tournament_created", tournament);
      res.status(201).json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.patch("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.updateTournament(req.params.id, req.body);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      broadcast("tournament_updated", tournament);
      res.json(tournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  // Tournament Teams
  app.get("/api/tournaments/:id/teams", async (req, res) => {
    try {
      const teams = await storage.getTournamentTeams(req.params.id);
      res.json(teams);
    } catch (error) {
      console.error("Error getting tournament teams:", error);
      res.status(500).json({ message: "Failed to get tournament teams" });
    }
  });

  app.post("/api/tournaments/:id/teams", async (req, res) => {
    try {
      const result = insertTournamentTeamSchema.safeParse({
        ...req.body,
        tournamentId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const team = await storage.createTournamentTeam(result.data);
      broadcast("tournament_team_created", team);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating tournament team:", error);
      res.status(500).json({ message: "Failed to create tournament team" });
    }
  });

  // Tournament Matches
  app.get("/api/tournaments/:id/matches", async (req, res) => {
    try {
      const matches = await storage.getTournamentMatches(req.params.id);
      // Enrich with team names
      const teams = await storage.getTournamentTeams(req.params.id);
      const enrichedMatches = matches.map(match => ({
        ...match,
        team1: teams.find(t => t.id === match.team1Id),
        team2: teams.find(t => t.id === match.team2Id),
        winner: teams.find(t => t.id === match.winnerId),
      }));
      res.json(enrichedMatches);
    } catch (error) {
      console.error("Error getting tournament matches:", error);
      res.status(500).json({ message: "Failed to get tournament matches" });
    }
  });

  app.post("/api/tournaments/:id/matches", async (req, res) => {
    try {
      const result = insertTournamentMatchSchema.safeParse({
        ...req.body,
        tournamentId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const match = await storage.createTournamentMatch(result.data);
      // Enrich with team data
      const teams = await storage.getTournamentTeams(req.params.id);
      const enrichedMatch = {
        ...match,
        team1: teams.find(t => t.id === match.team1Id),
        team2: teams.find(t => t.id === match.team2Id),
      };
      broadcast("match_created", enrichedMatch);
      res.status(201).json(enrichedMatch);
    } catch (error) {
      console.error("Error creating tournament match:", error);
      res.status(500).json({ message: "Failed to create tournament match" });
    }
  });

  app.patch("/api/tournaments/:tournamentId/matches/:matchId", async (req, res) => {
    try {
      const match = await storage.updateTournamentMatch(req.params.matchId, req.body);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      // Get teams for enriched response
      const teams = await storage.getTournamentTeams(req.params.tournamentId);
      const enrichedMatch = {
        ...match,
        team1: teams.find(t => t.id === match.team1Id),
        team2: teams.find(t => t.id === match.team2Id),
        winner: teams.find(t => t.id === match.winnerId),
      };
      broadcast("match_updated", enrichedMatch);
      res.json(enrichedMatch);
    } catch (error) {
      console.error("Error updating tournament match:", error);
      res.status(500).json({ message: "Failed to update tournament match" });
    }
  });

  // Live score update - special endpoint for real-time score changes
  app.post("/api/tournaments/:tournamentId/matches/:matchId/score", async (req, res) => {
    try {
      const { team1Score, team2Score } = req.body;
      const match = await storage.updateTournamentMatch(req.params.matchId, {
        team1Score,
        team2Score,
        status: "live",
      });
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      // Get teams for enriched response
      const teams = await storage.getTournamentTeams(req.params.tournamentId);
      const enrichedMatch = {
        ...match,
        team1: teams.find(t => t.id === match.team1Id),
        team2: teams.find(t => t.id === match.team2Id),
      };
      broadcast("score_updated", enrichedMatch);
      res.json(enrichedMatch);
    } catch (error) {
      console.error("Error updating match score:", error);
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  app.delete("/api/tournaments/:tournamentId/matches/:matchId", async (req, res) => {
    try {
      await storage.deleteTournamentMatch(req.params.matchId);
      broadcast("match_deleted", { id: req.params.matchId, tournamentId: req.params.tournamentId });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tournament match:", error);
      res.status(500).json({ message: "Failed to delete tournament match" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error getting expenses:", error);
      res.status(500).json({ message: "Failed to get expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const expense = await storage.createExpense(result.data);
      broadcast("expense_created", expense);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      broadcast("expense_deleted", { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Maintenance Logs
  app.get("/api/maintenance", async (req, res) => {
    try {
      const logs = await storage.getMaintenanceLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error getting maintenance logs:", error);
      res.status(500).json({ message: "Failed to get maintenance logs" });
    }
  });

  // Helper to check if user has owner role
  const requireOwnerRole = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated?.() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const currentUser = await storage.getUser(req.user.claims.sub);
    if (!currentUser || currentUser.role !== "owner") {
      return res.status(403).json({ message: "Forbidden - Owner access required" });
    }
    next();
  };

  // Staff Management (RBAC) - Owner only
  app.get("/api/staff", requireOwnerRole, async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error getting staff:", error);
      res.status(500).json({ message: "Failed to get staff" });
    }
  });

  app.patch("/api/staff/:id/role", requireOwnerRole, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error updating staff role:", error);
      res.status(500).json({ message: "Failed to update staff role" });
    }
  });

  // ========== Membership Plans (Owner only) ==========
  app.get("/api/membership-plans", async (req, res) => {
    try {
      const plans = await storage.getMembershipPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error getting membership plans:", error);
      res.status(500).json({ message: "Failed to get membership plans" });
    }
  });

  app.post("/api/membership-plans", requireOwnerRole, async (req, res) => {
    try {
      const result = insertMembershipPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const plan = await storage.createMembershipPlan(result.data);
      broadcast("membership_plan_created", plan);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating membership plan:", error);
      res.status(500).json({ message: "Failed to create membership plan" });
    }
  });

  app.patch("/api/membership-plans/:id", requireOwnerRole, async (req, res) => {
    try {
      const plan = await storage.updateMembershipPlan(req.params.id, req.body);
      if (!plan) {
        return res.status(404).json({ message: "Membership plan not found" });
      }
      broadcast("membership_plan_updated", plan);
      res.json(plan);
    } catch (error) {
      console.error("Error updating membership plan:", error);
      res.status(500).json({ message: "Failed to update membership plan" });
    }
  });

  app.delete("/api/membership-plans/:id", requireOwnerRole, async (req, res) => {
    try {
      await storage.deleteMembershipPlan(req.params.id);
      broadcast("membership_plan_deleted", { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      res.status(500).json({ message: "Failed to delete membership plan" });
    }
  });

  // ========== Customer Memberships ==========
  app.get("/api/memberships", async (req, res) => {
    try {
      const allMemberships = await storage.getMemberships();
      // Enrich with plan details
      const plans = await storage.getMembershipPlans();
      const planMap = new Map(plans.map(p => [p.id, p]));
      
      const enriched = allMemberships.map(m => ({
        ...m,
        plan: planMap.get(m.planId),
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error getting memberships:", error);
      res.status(500).json({ message: "Failed to get memberships" });
    }
  });

  app.get("/api/customers/:customerId/membership", async (req, res) => {
    try {
      const membership = await storage.getActiveMembership(req.params.customerId);
      if (!membership) {
        return res.json(null);
      }
      const plan = await storage.getMembershipPlan(membership.planId);
      res.json({ ...membership, plan });
    } catch (error) {
      console.error("Error getting customer membership:", error);
      res.status(500).json({ message: "Failed to get customer membership" });
    }
  });

  app.post("/api/memberships", async (req, res) => {
    try {
      const result = insertMembershipSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      // Check if customer exists
      const customer = await storage.getCustomer(result.data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Check if plan exists
      const plan = await storage.getMembershipPlan(result.data.planId);
      if (!plan) {
        return res.status(404).json({ message: "Membership plan not found" });
      }
      
      const membership = await storage.createMembership(result.data);
      
      // Add VIP tag to customer if not already present
      if (!customer.tags.includes("VIP")) {
        const updatedCustomer = await storage.updateCustomer(customer.id, {
          tags: [...customer.tags, "VIP"],
        });
        if (updatedCustomer) {
          broadcast("customer_updated", updatedCustomer);
        }
      }
      
      // Award loyalty points for joining membership (10 points per 100 spent)
      const pointsEarned = Math.floor(Number(result.data.paidAmount) / 100) * 10;
      if (pointsEarned > 0) {
        const loyaltyRecord = await storage.createLoyaltyPoints({
          customerId: result.data.customerId,
          type: "earned",
          points: pointsEarned,
          description: `Membership purchase: ${plan.name}`,
        });
        broadcast("loyalty_earned", { ...loyaltyRecord, balance: pointsEarned });
      }
      
      broadcast("membership_created", { ...membership, plan });
      res.status(201).json({ ...membership, plan, pointsEarned });
    } catch (error) {
      console.error("Error creating membership:", error);
      res.status(500).json({ message: "Failed to create membership" });
    }
  });

  app.patch("/api/memberships/:id", async (req, res) => {
    try {
      const membership = await storage.updateMembership(req.params.id, req.body);
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
      broadcast("membership_updated", membership);
      res.json(membership);
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  // ========== Loyalty Points ==========
  app.get("/api/customers/:customerId/loyalty", async (req, res) => {
    try {
      const points = await storage.getLoyaltyPoints(req.params.customerId);
      const balance = await storage.getCustomerPointsBalance(req.params.customerId);
      
      // Calculate stats
      const earned = points.filter(p => p.type === "earned").reduce((sum, p) => sum + p.points, 0);
      const redeemed = points.filter(p => p.type === "redeemed").reduce((sum, p) => sum + Math.abs(p.points), 0);
      
      res.json({
        balance,
        lifetimeEarned: earned,
        lifetimeRedeemed: redeemed,
        history: points.slice(0, 20), // Last 20 transactions
      });
    } catch (error) {
      console.error("Error getting customer loyalty:", error);
      res.status(500).json({ message: "Failed to get loyalty points" });
    }
  });

  app.post("/api/customers/:customerId/loyalty/earn", async (req, res) => {
    try {
      const { points, description, bookingId } = req.body;
      if (!points || points <= 0) {
        return res.status(400).json({ message: "Points must be positive" });
      }
      
      const pointsRecord = await storage.createLoyaltyPoints({
        customerId: req.params.customerId,
        type: "earned",
        points,
        description: description || "Points earned",
        bookingId,
      });
      
      const balance = await storage.getCustomerPointsBalance(req.params.customerId);
      broadcast("loyalty_earned", { ...pointsRecord, balance });
      res.status(201).json({ ...pointsRecord, balance });
    } catch (error) {
      console.error("Error earning loyalty points:", error);
      res.status(500).json({ message: "Failed to earn loyalty points" });
    }
  });

  app.post("/api/customers/:customerId/loyalty/redeem", async (req, res) => {
    try {
      const { points, description } = req.body;
      if (!points || points <= 0) {
        return res.status(400).json({ message: "Points must be positive" });
      }
      
      // Check balance
      const balance = await storage.getCustomerPointsBalance(req.params.customerId);
      if (balance < points) {
        return res.status(400).json({ message: `Insufficient points. Available: ${balance}` });
      }
      
      const pointsRecord = await storage.createLoyaltyPoints({
        customerId: req.params.customerId,
        type: "redeemed",
        points: -points, // Negative for redemption
        description: description || "Points redeemed",
      });
      
      const newBalance = await storage.getCustomerPointsBalance(req.params.customerId);
      broadcast("loyalty_redeemed", { ...pointsRecord, balance: newBalance });
      res.status(201).json({ ...pointsRecord, balance: newBalance });
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      res.status(500).json({ message: "Failed to redeem loyalty points" });
    }
  });

  return httpServer;
}
