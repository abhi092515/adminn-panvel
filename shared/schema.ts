import { z } from "zod";

// Re-export auth schema (includes users table)
export * from "./models/auth";
import { type User } from "./models/auth";

// Types derived from schema
export type Court = {
  id: string;
  name: string;
  sport: string;
  description: string | null;
  hourlyRate: string; // decimal as string
  peakHourlyRate: string | null; // decimal as string
  isActive: boolean;
  imageUrl: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalSpend: string; // decimal as string
  totalBookings: number;
  noShowCount: number;
  tags: string[];
  notes: string | null;
  isBlacklisted: boolean;
  source: string;
};

export type Booking = {
  id: string;
  courtId: string;
  customerId: string;
  bookedById: string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: string; // decimal as string
  paidAmount: string; // decimal as string
  paymentStatus: string;
  paymentMethod: string | null;
  status: string;
  qrCode: string | null;
  notes: string | null;
  isTeamBooking: boolean;
  teamName: string | null;
  createdAt: Date;
};

export type Transaction = {
  id: string;
  bookingId: string | null;
  customerId: string | null;
  type: string;
  amount: string; // decimal as string
  paymentMethod: string;
  status: string;
  notes: string | null;
  processedById: string | null;
  createdAt: Date;
};

export type Settlement = {
  id: string;
  amount: string; // decimal as string
  commissionRate: string; // decimal as string
  status: string;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  totalCashReceived: string; // decimal as string
  paidAt: Date | null;
  createdAt: Date;
};

export type Waitlist = {
  id: string;
  courtId: string;
  customerId: string;
  date: string;
  preferredStartTime: string;
  preferredEndTime: string;
  status: string;
  notifiedAt: Date | null;
  createdAt: Date;
};

export type BlockedSlot = {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  blockedById: string | null;
  createdAt: Date;
};

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  entryFee: string; // decimal as string
  maxTeams: number;
  startDate: string;
  endDate: string;
  status: string;
  description: string | null;
  prizePool: string | null; // decimal as string
  createdAt: Date;
};

export type TournamentTeam = {
  id: string;
  tournamentId: string;
  name: string;
  captainId: string | null;
  players: string[];
  isPaid: boolean;
  createdAt: Date;
};

export type TournamentMatch = {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  status: string;
  scheduledTime: string | null;
  courtId: string | null;
  notes: string | null;
  createdAt: Date;
};

export type MaintenanceLog = {
  id: string;
  courtId: string;
  issue: string;
  description: string | null;
  photoUrl: string | null;
  status: string;
  reportedById: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

export type Expense = {
  id: string;
  category: string;
  amount: string; // decimal as string
  description: string | null;
  date: string;
  addedById: string | null;
  createdAt: Date;
};

export type MembershipPlan = {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: string; // decimal as string
  discountPercent: number;
  freeHours: number;
  priority: boolean;
  isActive: boolean;
  createdAt: Date;
};

export type Membership = {
  id: string;
  customerId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
  usedFreeHours: number;
  paidAmount: string; // decimal as string
  paymentMethod: string | null;
  createdAt: Date;
};

export type LoyaltyPoints = {
  id: string;
  customerId: string;
  type: string;
  points: number;
  description: string;
  bookingId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type VenueReview = {
  image?: string;
  username: string;
  stars: number;
  text?: string;
};

export type Venue = {
  id: string;
  title: string;
  location: string;
  isFav: boolean;
  shareableLink?: string;
  mainCategoryId?: string;
  categoryId?: string;
  images: string[];
  aboutVenue: {
    contactDetails?: string;
    bio?: string;
    operationalHours?: string;
  };
  amenities: string[];
  direction?: string;
  reviews: VenueReview[];
  price: string;
  createdAt: Date;
};

export type MainCategory = {
  id: string;
  title: string;
  image?: string;
  priority?: number;
  description?: string;
  status?: string;
  createdAt: Date;
};

export type Category = {
  id: string;
  title: string;
  image?: string;
  priority?: number;
  description?: string;
  status?: string;
  mainCategoryId?: string;
  createdAt: Date;
};

// Zod Schemas for Insert (Validation)
// Using strings for decimals to maintain compatibility with numeric input forms
export const insertCourtSchema = z.object({
  name: z.string().min(1),
  sport: z.string().min(1),
  description: z.string().optional(),
  hourlyRate: z.string(),
  peakHourlyRate: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isBlacklisted: z.boolean().default(false),
  source: z.string().default("walkin"),
});

export const insertBookingSchema = z.object({
  courtId: z.string().min(1),
  customerId: z.string().min(1),
  bookedById: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().int(),
  totalAmount: z.string(),
  paidAmount: z.string().default("0"),
  paymentStatus: z.string().default("pending"),
  paymentMethod: z.string().optional(),
  status: z.string().default("confirmed"),
  qrCode: z.string().optional(),
  notes: z.string().optional(),
  isTeamBooking: z.boolean().default(false),
  teamName: z.string().optional(),
});

export const insertTransactionSchema = z.object({
  bookingId: z.string().optional(),
  customerId: z.string().optional(),
  type: z.string(),
  amount: z.string(),
  paymentMethod: z.string(),
  status: z.string().default("completed"),
  notes: z.string().optional(),
  processedById: z.string().optional(),
});

export const insertSettlementSchema = z.object({
  amount: z.string(),
  commissionRate: z.string().default("5.00"),
  status: z.string().default("pending"),
  periodStart: z.string(),
  periodEnd: z.string(),
  totalBookings: z.number().int().default(0),
  totalCashReceived: z.string().default("0"),
});

export const insertWaitlistSchema = z.object({
  courtId: z.string(),
  customerId: z.string(),
  date: z.string(),
  preferredStartTime: z.string(),
  preferredEndTime: z.string(),
  status: z.string().default("waiting"),
});

export const insertBlockedSlotSchema = z.object({
  courtId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string(),
  blockedById: z.string().optional(),
});

export const insertTournamentSchema = z.object({
  name: z.string(),
  sport: z.string(),
  entryFee: z.string().default("0"),
  maxTeams: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string().default("upcoming"),
  description: z.string().optional(),
  prizePool: z.string().optional(),
});

export const insertTournamentTeamSchema = z.object({
  tournamentId: z.string(),
  name: z.string(),
  captainId: z.string().optional(),
  players: z.array(z.string()).default([]),
  isPaid: z.boolean().default(false),
});

export const insertTournamentMatchSchema = z.object({
  tournamentId: z.string(),
  round: z.number().int().default(1),
  matchNumber: z.number().int(),
  team1Id: z.string().optional(),
  team2Id: z.string().optional(),
  team1Score: z.number().int().default(0),
  team2Score: z.number().int().default(0),
  winnerId: z.string().optional(),
  status: z.string().default("scheduled"),
  scheduledTime: z.string().optional(),
  courtId: z.string().optional(),
  notes: z.string().optional(),
});

export const insertMaintenanceLogSchema = z.object({
  courtId: z.string(),
  issue: z.string(),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.string().default("reported"),
  reportedById: z.string().optional(),
});

export const insertExpenseSchema = z.object({
  category: z.string(),
  amount: z.string(),
  description: z.string().optional(),
  date: z.string(),
  addedById: z.string().optional(),
});

export const insertMembershipPlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  durationDays: z.number().int(),
  price: z.string(),
  discountPercent: z.number().int().default(0),
  freeHours: z.number().int().default(0),
  priority: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const insertMembershipSchema = z.object({
  customerId: z.string(),
  planId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string().default("active"),
  usedFreeHours: z.number().int().default(0),
  paidAmount: z.string(),
  paymentMethod: z.string().optional(),
});

export const insertLoyaltyPointsSchema = z.object({
  customerId: z.string(),
  type: z.string(),
  points: z.number().int(),
  description: z.string(),
  bookingId: z.string().optional(),
  expiresAt: z.string().optional().transform(str => str ? new Date(str) : null),
});

export const insertMainCategorySchema = z.object({
  title: z.string().min(1),
  image: z.string().url().optional(),
  priority: z.number().int().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const insertCategorySchema = z.object({
  title: z.string().min(1),
  image: z.string().url().optional(),
  priority: z.number().int().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  mainCategoryId: z.string().optional(),
});

export const insertVenueSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  isFav: z.boolean().default(false),
  shareableLink: z.string().url().optional(),
  mainCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string()).default([]),
  aboutVenue: z.object({
    contactDetails: z.string().optional(),
    bio: z.string().optional(),
    operationalHours: z.string().optional(),
  }),
  amenities: z.array(z.string()).default([]),
  direction: z.string().optional(),
  reviews: z.array(
    z.object({
      image: z.string().optional(),
      username: z.string(),
      stars: z.number().int().min(1).max(5),
      text: z.string().optional(),
    }),
  ).default([]),
  price: z.string().min(1),
});

// Types for insertion
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type InsertBlockedSlot = z.infer<typeof insertBlockedSlotSchema>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type InsertTournamentTeam = z.infer<typeof insertTournamentTeamSchema>;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type InsertMainCategory = z.infer<typeof insertMainCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

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
