import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export auth schema (includes users table)
export * from "./models/auth";
import { users, type User } from "./models/auth";

// Courts/Turfs table
export const courts = pgTable("courts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(), // cricket, football, badminton, tennis
  description: text("description"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  peakHourlyRate: decimal("peak_hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
});

// Customers table (CRM)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).notNull().default("0"),
  totalBookings: integer("total_bookings").notNull().default(0),
  noShowCount: integer("no_show_count").notNull().default(0),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`), // VIP, HIGH_RISK, REGULAR
  notes: text("notes"),
  isBlacklisted: boolean("is_blacklisted").notNull().default(false),
  source: text("source").notNull().default("walkin"), // app, walkin, website
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  bookedById: varchar("booked_by_id").references(() => users.id), // staff who made the booking
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  duration: integer("duration").notNull(), // in minutes
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, partial, paid
  paymentMethod: text("payment_method"), // cash, upi, card, online
  status: text("status").notNull().default("confirmed"), // confirmed, checked_in, completed, cancelled, no_show
  qrCode: text("qr_code"),
  notes: text("notes"),
  isTeamBooking: boolean("is_team_booking").notNull().default(false),
  teamName: text("team_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customers.id),
  type: text("type").notNull(), // booking_payment, refund, settlement
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, upi, card, online
  status: text("status").notNull().default("completed"), // pending, completed, failed
  notes: text("notes"),
  processedById: varchar("processed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Settlements table (commission payments to platform)
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  status: text("status").notNull().default("pending"), // pending, paid
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalCashReceived: decimal("total_cash_received", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Waitlist table
export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  date: text("date").notNull(),
  preferredStartTime: text("preferred_start_time").notNull(),
  preferredEndTime: text("preferred_end_time").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, notified, booked, expired
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Blocked slots table (maintenance, private events)
export const blockedSlots = pgTable("blocked_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  reason: text("reason").notNull(),
  blockedById: varchar("blocked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  maxTeams: integer("max_teams").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, ongoing, completed
  description: text("description"),
  prizePool: decimal("prize_pool", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tournament teams table
export const tournamentTeams = pgTable("tournament_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id),
  name: text("name").notNull(),
  captainId: varchar("captain_id").references(() => customers.id),
  players: jsonb("players").notNull().default(sql`'[]'::jsonb`), // array of player names
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Maintenance log table
export const maintenanceLogs = pgTable("maintenance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  issue: text("issue").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("reported"), // reported, in_progress, resolved
  reportedById: varchar("reported_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // electricity, staff, maintenance, other
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: text("date").notNull(),
  addedById: varchar("added_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Membership Plans table
export const membershipPlans = pgTable("membership_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  durationDays: integer("duration_days").notNull(), // 30, 90, 365 etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: integer("discount_percent").notNull().default(0), // booking discount
  freeHours: integer("free_hours").notNull().default(0), // free playing hours per month
  priority: boolean("priority").notNull().default(false), // priority booking
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer Memberships table  
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  planId: varchar("plan_id").notNull().references(() => membershipPlans.id),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  status: text("status").notNull().default("active"), // active, expired, cancelled
  usedFreeHours: integer("used_free_hours").notNull().default(0),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // cash, upi, card, online
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loyalty Points table
export const loyaltyPoints = pgTable("loyalty_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  type: text("type").notNull(), // earned, redeemed, expired
  points: integer("points").notNull(), // positive for earned, negative for redeemed
  description: text("description").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  expiresAt: timestamp("expires_at"), // loyalty points expiry
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const courtsRelations = relations(courts, ({ many }) => ({
  bookings: many(bookings),
  waitlist: many(waitlist),
  blockedSlots: many(blockedSlots),
  maintenanceLogs: many(maintenanceLogs),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
  transactions: many(transactions),
  waitlist: many(waitlist),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  court: one(courts, { fields: [bookings.courtId], references: [courts.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  bookedBy: one(users, { fields: [bookings.bookedById], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  booking: one(bookings, { fields: [transactions.bookingId], references: [bookings.id] }),
  customer: one(customers, { fields: [transactions.customerId], references: [customers.id] }),
  processedBy: one(users, { fields: [transactions.processedById], references: [users.id] }),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  teams: many(tournamentTeams),
}));

export const tournamentTeamsRelations = relations(tournamentTeams, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentTeams.tournamentId], references: [tournaments.id] }),
  captain: one(customers, { fields: [tournamentTeams.captainId], references: [customers.id] }),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  customer: one(customers, { fields: [memberships.customerId], references: [customers.id] }),
  plan: one(membershipPlans, { fields: [memberships.planId], references: [membershipPlans.id] }),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  customer: one(customers, { fields: [loyaltyPoints.customerId], references: [customers.id] }),
  booking: one(bookings, { fields: [loyaltyPoints.bookingId], references: [bookings.id] }),
}));

// Insert schemas
export const insertCourtSchema = createInsertSchema(courts).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, totalSpend: true, totalBookings: true, noShowCount: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertSettlementSchema = createInsertSchema(settlements).omit({ id: true, createdAt: true, paidAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true, notifiedAt: true });
export const insertBlockedSlotSchema = createInsertSchema(blockedSlots).omit({ id: true, createdAt: true });
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true });
export const insertTournamentTeamSchema = createInsertSchema(tournamentTeams).omit({ id: true, createdAt: true });
export const insertMaintenanceLogSchema = createInsertSchema(maintenanceLogs).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({ id: true, createdAt: true });
export const insertMembershipSchema = createInsertSchema(memberships).omit({ id: true, createdAt: true });
export const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints).omit({ id: true, createdAt: true });

// Types
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courts.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Settlement = typeof settlements.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertBlockedSlot = z.infer<typeof insertBlockedSlotSchema>;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournamentTeam = z.infer<typeof insertTournamentTeamSchema>;
export type TournamentTeam = typeof tournamentTeams.$inferSelect;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;
export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;

// Extended types for frontend
export type BookingWithDetails = Booking & {
  court?: Court;
  customer?: Customer;
  bookedBy?: User;
};

export type CustomerWithStats = Customer & {
  reliabilityScore: number;
  isVip: boolean;
  isHighRisk: boolean;
};

export type MembershipWithPlan = Membership & {
  plan?: MembershipPlan;
  customer?: Customer;
};

export type CustomerLoyalty = {
  customerId: string;
  totalPoints: number;
  availablePoints: number;
  pendingPoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
};

// Dashboard stats type
export type DashboardStats = {
  totalBookingsToday: number;
  totalRevenueToday: number;
  occupiedCourts: number;
  totalCourts: number;
  pendingCheckIns: number;
  pendingPayments: number;
  weeklyRevenue: { day: string; revenue: number }[];
  peakHours: { hour: string; bookings: number }[];
};

// Settlement summary type
export type SettlementSummary = {
  totalEarnings: number;
  totalSettled: number;
  amountDue: number;
  commissionRate: number;
  pendingSettlements: Settlement[];
};
