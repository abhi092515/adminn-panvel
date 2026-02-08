import mongoose from "mongoose";
import {
  User, Court, Customer, Booking, Transaction, Settlement,
  Waitlist, BlockedSlot, Tournament, TournamentTeam, TournamentMatch,
  MaintenanceLog, Expense, MembershipPlan, Membership, LoyaltyPoints, Venue,
  MainCategory, Category,
} from "./models";

import type {
  User as UserType,
  Court as CourtType, InsertCourt,
  Customer as CustomerType, InsertCustomer,
  Booking as BookingType, InsertBooking,
  Transaction as TransactionType, InsertTransaction,
  Settlement as SettlementType, InsertSettlement,
  Waitlist as WaitlistType, InsertWaitlist,
  BlockedSlot as BlockedSlotType, InsertBlockedSlot,
  Tournament as TournamentType, InsertTournament,
  TournamentTeam as TournamentTeamType, InsertTournamentTeam,
  TournamentMatch as TournamentMatchType, InsertTournamentMatch,
  MaintenanceLog as MaintenanceLogType, InsertMaintenanceLog,
  Expense as ExpenseType, InsertExpense,
  MembershipPlan as MembershipPlanType, InsertMembershipPlan,
  Membership as MembershipType, InsertMembership,
  LoyaltyPoints as LoyaltyPointsType, InsertLoyaltyPoints,
  Venue as VenueType, InsertVenue,
  MainCategory as MainCategoryType, InsertMainCategory,
  Category as CategoryType, InsertCategory,
} from "@shared/schema";

// Helper to map Mongo document to Type
function mapDoc<T>(doc: any): T {
  if (!doc) return undefined as any;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<UserType | undefined>;
  createUser(user: any): Promise<UserType>;

  // Staff (RBAC)
  getStaff(): Promise<UserType[]>;
  updateStaffRole(id: string, role: string): Promise<UserType | undefined>;

  // Courts
  getCourts(): Promise<CourtType[]>;
  getCourt(id: string): Promise<CourtType | undefined>;
  createCourt(court: InsertCourt): Promise<CourtType>;
  updateCourt(id: string, court: Partial<InsertCourt>): Promise<CourtType | undefined>;
  deleteCourt(id: string): Promise<void>;

  // Customers
  getCustomers(): Promise<CustomerType[]>;
  getCustomer(id: string): Promise<CustomerType | undefined>;
  getCustomerByPhone(phone: string): Promise<CustomerType | undefined>;
  createCustomer(customer: InsertCustomer): Promise<CustomerType>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<CustomerType | undefined>;

  // Bookings
  getBookings(): Promise<BookingType[]>;
  getBookingsByDate(date: string): Promise<BookingType[]>;
  getBooking(id: string): Promise<BookingType | undefined>;
  createBooking(booking: InsertBooking): Promise<BookingType>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<BookingType | undefined>;
  deleteBooking(id: string): Promise<void>;

  // Transactions
  getTransactions(): Promise<TransactionType[]>;
  createTransaction(transaction: InsertTransaction): Promise<TransactionType>;

  // Settlements
  getSettlements(): Promise<SettlementType[]>;
  createSettlement(settlement: InsertSettlement): Promise<SettlementType>;
  updateSettlement(id: string, settlement: Partial<InsertSettlement>): Promise<SettlementType | undefined>;

  // Waitlist
  getWaitlist(): Promise<WaitlistType[]>;
  getWaitlistItem(id: string): Promise<WaitlistType | undefined>;
  createWaitlistItem(item: InsertWaitlist): Promise<WaitlistType>;
  updateWaitlistItem(id: string, item: Partial<InsertWaitlist>): Promise<WaitlistType | undefined>;

  // Blocked Slots
  getBlockedSlots(): Promise<BlockedSlotType[]>;
  createBlockedSlot(slot: InsertBlockedSlot): Promise<BlockedSlotType>;
  deleteBlockedSlot(id: string): Promise<void>;

  // Tournaments
  getTournaments(): Promise<TournamentType[]>;
  getTournament(id: string): Promise<TournamentType | undefined>;
  createTournament(tournament: InsertTournament): Promise<TournamentType>;
  updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<TournamentType | undefined>;

  // Tournament Teams
  getTournamentTeams(tournamentId: string): Promise<TournamentTeamType[]>;
  createTournamentTeam(team: InsertTournamentTeam): Promise<TournamentTeamType>;

  // Tournament Matches
  getTournamentMatches(tournamentId: string): Promise<TournamentMatchType[]>;
  getTournamentMatch(id: string): Promise<TournamentMatchType | undefined>;
  createTournamentMatch(match: InsertTournamentMatch): Promise<TournamentMatchType>;
  updateTournamentMatch(id: string, match: Partial<InsertTournamentMatch>): Promise<TournamentMatchType | undefined>;
  deleteTournamentMatch(id: string): Promise<void>;

  // Maintenance Logs
  getMaintenanceLogs(): Promise<MaintenanceLogType[]>;
  createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLogType>;
  updateMaintenanceLog(id: string, log: Partial<InsertMaintenanceLog>): Promise<MaintenanceLogType | undefined>;

  // Expenses
  getExpenses(): Promise<ExpenseType[]>;
  createExpense(expense: InsertExpense): Promise<ExpenseType>;
  deleteExpense(id: string): Promise<void>;

  // Membership Plans
  getMembershipPlans(): Promise<MembershipPlanType[]>;
  getMembershipPlan(id: string): Promise<MembershipPlanType | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlanType>;
  updateMembershipPlan(id: string, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlanType | undefined>;
  deleteMembershipPlan(id: string): Promise<void>;

  // Memberships
  getMemberships(): Promise<MembershipType[]>;
  getMembership(id: string): Promise<MembershipType | undefined>;
  getCustomerMemberships(customerId: string): Promise<MembershipType[]>;
  getActiveMembership(customerId: string): Promise<MembershipType | undefined>;
  createMembership(membership: InsertMembership): Promise<MembershipType>;
  updateMembership(id: string, membership: Partial<InsertMembership>): Promise<MembershipType | undefined>;

  // Loyalty Points
  getLoyaltyPoints(customerId: string): Promise<LoyaltyPointsType[]>;
  createLoyaltyPoints(points: InsertLoyaltyPoints): Promise<LoyaltyPointsType>;
  getCustomerPointsBalance(customerId: string): Promise<number>;

  // Venues
  getVenues(): Promise<VenueType[]>;
  getVenue(id: string): Promise<VenueType | undefined>;
  createVenue(venue: InsertVenue): Promise<VenueType>;
  updateVenue(id: string, venue: Partial<InsertVenue>): Promise<VenueType | undefined>;
  deleteVenue(id: string): Promise<void>;

  // Main Categories
  getMainCategories(): Promise<MainCategoryType[]>;
  getMainCategory(id: string): Promise<MainCategoryType | undefined>;
  createMainCategory(data: InsertMainCategory): Promise<MainCategoryType>;
  updateMainCategory(id: string, data: Partial<InsertMainCategory>): Promise<MainCategoryType | undefined>;
  deleteMainCategory(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<CategoryType[]>;
  getCategory(id: string): Promise<CategoryType | undefined>;
  createCategory(data: InsertCategory): Promise<CategoryType>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<CategoryType | undefined>;
  deleteCategory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<UserType | undefined> {
    const doc = await User.findById(id);
    return mapDoc(doc);
  }

  async createUser(user: any): Promise<UserType> {
    const doc = await User.create(user);
    return mapDoc(doc);
  }

  // Staff (RBAC)
  async getStaff(): Promise<UserType[]> {
    const docs = await User.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as UserType[];
  }

  async updateStaffRole(id: string, role: string): Promise<UserType | undefined> {
    const doc = await User.findByIdAndUpdate(id, { role, updatedAt: new Date() }, { new: true });
    return mapDoc(doc);
  }

  // Courts
  async getCourts(): Promise<CourtType[]> {
    const docs = await Court.find().sort({ name: 1 });
    return docs.map(mapDoc) as CourtType[];
  }

  async getCourt(id: string): Promise<CourtType | undefined> {
    const doc = await Court.findById(id);
    return mapDoc(doc);
  }

  async createCourt(court: InsertCourt): Promise<CourtType> {
    const doc = await Court.create(court);
    return mapDoc(doc);
  }

  async updateCourt(id: string, court: Partial<InsertCourt>): Promise<CourtType | undefined> {
    const doc = await Court.findByIdAndUpdate(id, court, { new: true });
    return mapDoc(doc);
  }

  async deleteCourt(id: string): Promise<void> {
    await Court.findByIdAndDelete(id);
  }

  // Customers
  async getCustomers(): Promise<CustomerType[]> {
    const docs = await Customer.find().sort({ totalSpend: -1 });
    return docs.map(mapDoc) as CustomerType[];
  }

  async getCustomer(id: string): Promise<CustomerType | undefined> {
    const doc = await Customer.findById(id);
    return mapDoc(doc);
  }

  async getCustomerByPhone(phone: string): Promise<CustomerType | undefined> {
    const doc = await Customer.findOne({ phone });
    return mapDoc(doc);
  }

  async createCustomer(customer: InsertCustomer): Promise<CustomerType> {
    const doc = await Customer.create(customer);
    return mapDoc(doc);
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<CustomerType | undefined> {
    const doc = await Customer.findByIdAndUpdate(id, customer, { new: true });
    return mapDoc(doc);
  }

  // Bookings
  async getBookings(): Promise<BookingType[]> {
    const docs = await Booking.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as BookingType[];
  }

  async getBookingsByDate(date: string): Promise<BookingType[]> {
    const docs = await Booking.find({ date }).sort({ startTime: 1 });
    return docs.map(mapDoc) as BookingType[];
  }

  async getBooking(id: string): Promise<BookingType | undefined> {
    const doc = await Booking.findById(id);
    return mapDoc(doc);
  }

  async createBooking(booking: InsertBooking): Promise<BookingType> {
    const doc = await Booking.create(booking);

    // Update customer stats
    await Customer.findByIdAndUpdate(booking.customerId, {
      $inc: {
        totalBookings: 1,
        // Since totalSpend is string in mongo, we can't atomically increment easily with simple $inc if it's not number
        // For simplicity in this migration, we'll fetch, update, save
      }
    });

    // Handle decimal addition separately
    const customer = await Customer.findById(booking.customerId);
    if (customer) {
      customer.totalSpend = (Number(customer.totalSpend || 0) + Number(booking.paidAmount || 0)).toFixed(2);
      await customer.save();
    }

    return mapDoc(doc);
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<BookingType | undefined> {
    const doc = await Booking.findByIdAndUpdate(id, booking, { new: true });
    return mapDoc(doc);
  }

  async deleteBooking(id: string): Promise<void> {
    await Booking.findByIdAndDelete(id);
  }

  // Transactions
  async getTransactions(): Promise<TransactionType[]> {
    const docs = await Transaction.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as TransactionType[];
  }

  async createTransaction(transaction: InsertTransaction): Promise<TransactionType> {
    const doc = await Transaction.create(transaction);
    return mapDoc(doc);
  }

  // Settlements
  async getSettlements(): Promise<SettlementType[]> {
    const docs = await Settlement.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as SettlementType[];
  }

  async createSettlement(settlement: InsertSettlement): Promise<SettlementType> {
    const doc = await Settlement.create(settlement);
    return mapDoc(doc);
  }

  async updateSettlement(id: string, settlement: Partial<InsertSettlement>): Promise<SettlementType | undefined> {
    const doc = await Settlement.findByIdAndUpdate(id, settlement, { new: true });
    return mapDoc(doc);
  }

  // Waitlist
  async getWaitlist(): Promise<WaitlistType[]> {
    const docs = await Waitlist.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as WaitlistType[];
  }

  async getWaitlistItem(id: string): Promise<WaitlistType | undefined> {
    const doc = await Waitlist.findById(id);
    return mapDoc(doc);
  }

  async createWaitlistItem(item: InsertWaitlist): Promise<WaitlistType> {
    const doc = await Waitlist.create(item);
    return mapDoc(doc);
  }

  async updateWaitlistItem(id: string, item: Partial<InsertWaitlist>): Promise<WaitlistType | undefined> {
    const doc = await Waitlist.findByIdAndUpdate(id, item, { new: true });
    return mapDoc(doc);
  }

  // Blocked Slots
  async getBlockedSlots(): Promise<BlockedSlotType[]> {
    const docs = await BlockedSlot.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as BlockedSlotType[];
  }

  async createBlockedSlot(slot: InsertBlockedSlot): Promise<BlockedSlotType> {
    const doc = await BlockedSlot.create(slot);
    return mapDoc(doc);
  }

  async deleteBlockedSlot(id: string): Promise<void> {
    await BlockedSlot.findByIdAndDelete(id);
  }

  // Tournaments
  async getTournaments(): Promise<TournamentType[]> {
    const docs = await Tournament.find().sort({ startDate: -1 });
    return docs.map(mapDoc) as TournamentType[];
  }

  async getTournament(id: string): Promise<TournamentType | undefined> {
    const doc = await Tournament.findById(id);
    return mapDoc(doc);
  }

  async createTournament(tournament: InsertTournament): Promise<TournamentType> {
    const doc = await Tournament.create(tournament);
    return mapDoc(doc);
  }

  async updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<TournamentType | undefined> {
    const doc = await Tournament.findByIdAndUpdate(id, tournament, { new: true });
    return mapDoc(doc);
  }

  // Tournament Teams
  async getTournamentTeams(tournamentId: string): Promise<TournamentTeamType[]> {
    const docs = await TournamentTeam.find({ tournamentId });
    return docs.map(mapDoc) as TournamentTeamType[];
  }

  async createTournamentTeam(team: InsertTournamentTeam): Promise<TournamentTeamType> {
    const doc = await TournamentTeam.create(team);
    return mapDoc(doc);
  }

  // Tournament Matches
  async getTournamentMatches(tournamentId: string): Promise<TournamentMatchType[]> {
    const docs = await TournamentMatch.find({ tournamentId }).sort({ round: 1, matchNumber: 1 });
    return docs.map(mapDoc) as TournamentMatchType[];
  }

  async getTournamentMatch(id: string): Promise<TournamentMatchType | undefined> {
    const doc = await TournamentMatch.findById(id);
    return mapDoc(doc);
  }

  async createTournamentMatch(match: InsertTournamentMatch): Promise<TournamentMatchType> {
    const doc = await TournamentMatch.create(match);
    return mapDoc(doc);
  }

  async updateTournamentMatch(id: string, match: Partial<InsertTournamentMatch>): Promise<TournamentMatchType | undefined> {
    const doc = await TournamentMatch.findByIdAndUpdate(id, match, { new: true });
    return mapDoc(doc);
  }

  async deleteTournamentMatch(id: string): Promise<void> {
    await TournamentMatch.findByIdAndDelete(id);
  }

  // Maintenance Logs
  async getMaintenanceLogs(): Promise<MaintenanceLogType[]> {
    const docs = await MaintenanceLog.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as MaintenanceLogType[];
  }

  async createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLogType> {
    const doc = await MaintenanceLog.create(log);
    return mapDoc(doc);
  }

  async updateMaintenanceLog(id: string, log: Partial<InsertMaintenanceLog>): Promise<MaintenanceLogType | undefined> {
    const doc = await MaintenanceLog.findByIdAndUpdate(id, log, { new: true });
    return mapDoc(doc);
  }

  // Expenses
  async getExpenses(): Promise<ExpenseType[]> {
    const docs = await Expense.find().sort({ date: -1 });
    return docs.map(mapDoc) as ExpenseType[];
  }

  async createExpense(expense: InsertExpense): Promise<ExpenseType> {
    const doc = await Expense.create(expense);
    return mapDoc(doc);
  }

  async deleteExpense(id: string): Promise<void> {
    await Expense.findByIdAndDelete(id);
  }

  // Membership Plans
  async getMembershipPlans(): Promise<MembershipPlanType[]> {
    const docs = await MembershipPlan.find().sort({ price: 1 });
    return docs.map(mapDoc) as MembershipPlanType[];
  }

  async getMembershipPlan(id: string): Promise<MembershipPlanType | undefined> {
    const doc = await MembershipPlan.findById(id);
    return mapDoc(doc);
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlanType> {
    const doc = await MembershipPlan.create(plan);
    return mapDoc(doc);
  }

  async updateMembershipPlan(id: string, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlanType | undefined> {
    const doc = await MembershipPlan.findByIdAndUpdate(id, plan, { new: true });
    return mapDoc(doc);
  }

  async deleteMembershipPlan(id: string): Promise<void> {
    await MembershipPlan.findByIdAndDelete(id);
  }

  // Memberships
  async getMemberships(): Promise<MembershipType[]> {
    const docs = await Membership.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as MembershipType[];
  }

  async getMembership(id: string): Promise<MembershipType | undefined> {
    const doc = await Membership.findById(id);
    return mapDoc(doc);
  }

  async getCustomerMemberships(customerId: string): Promise<MembershipType[]> {
    const docs = await Membership.find({ customerId }).sort({ createdAt: -1 });
    return docs.map(mapDoc) as MembershipType[];
  }

  async getActiveMembership(customerId: string): Promise<MembershipType | undefined> {
    const today = new Date().toISOString().split("T")[0];
    const doc = await Membership.findOne({
      customerId,
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    return mapDoc(doc);
  }

  async createMembership(membership: InsertMembership): Promise<MembershipType> {
    const doc = await Membership.create(membership);
    return mapDoc(doc);
  }

  async updateMembership(id: string, membership: Partial<InsertMembership>): Promise<MembershipType | undefined> {
    const doc = await Membership.findByIdAndUpdate(id, membership, { new: true });
    return mapDoc(doc);
  }

  // Loyalty Points
  async getLoyaltyPoints(customerId: string): Promise<LoyaltyPointsType[]> {
    const docs = await LoyaltyPoints.find({ customerId }).sort({ createdAt: -1 });
    return docs.map(mapDoc) as LoyaltyPointsType[];
  }

  async createLoyaltyPoints(points: InsertLoyaltyPoints): Promise<LoyaltyPointsType> {
    const doc = await LoyaltyPoints.create(points);
    return mapDoc(doc);
  }

  async getCustomerPointsBalance(customerId: string): Promise<number> {
    const result = await LoyaltyPoints.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    return result[0]?.total || 0;
  }

  // Venues
  async getVenues(): Promise<VenueType[]> {
    const docs = await Venue.find().sort({ createdAt: -1 });
    return docs.map(mapDoc) as VenueType[];
  }

  async getVenue(id: string): Promise<VenueType | undefined> {
    const doc = await Venue.findById(id);
    return mapDoc(doc);
  }

  async createVenue(venue: InsertVenue): Promise<VenueType> {
    const doc = await Venue.create(venue);
    return mapDoc(doc);
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<VenueType | undefined> {
    const doc = await Venue.findByIdAndUpdate(id, venue, { new: true });
    return mapDoc(doc);
  }

  async deleteVenue(id: string): Promise<void> {
    await Venue.findByIdAndDelete(id);
  }

  // Main Categories
  async getMainCategories(): Promise<MainCategoryType[]> {
    const docs = await MainCategory.find().sort({ priority: 1, createdAt: -1 });
    return docs.map(mapDoc) as MainCategoryType[];
  }

  async getMainCategory(id: string): Promise<MainCategoryType | undefined> {
    const doc = await MainCategory.findById(id);
    return mapDoc(doc);
  }

  async createMainCategory(data: InsertMainCategory): Promise<MainCategoryType> {
    const doc = await MainCategory.create(data);
    return mapDoc(doc);
  }

  async updateMainCategory(id: string, data: Partial<InsertMainCategory>): Promise<MainCategoryType | undefined> {
    const doc = await MainCategory.findByIdAndUpdate(id, data, { new: true });
    return mapDoc(doc);
  }

  async deleteMainCategory(id: string): Promise<void> {
    await MainCategory.findByIdAndDelete(id);
  }

  // Categories
  async getCategories(): Promise<CategoryType[]> {
    const docs = await Category.find().sort({ priority: 1, createdAt: -1 });
    return docs.map(mapDoc) as CategoryType[];
  }

  async getCategory(id: string): Promise<CategoryType | undefined> {
    const doc = await Category.findById(id);
    return mapDoc(doc);
  }

  async createCategory(data: InsertCategory): Promise<CategoryType> {
    const doc = await Category.create(data);
    return mapDoc(doc);
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<CategoryType | undefined> {
    const doc = await Category.findByIdAndUpdate(id, data, { new: true });
    return mapDoc(doc);
  }

  async deleteCategory(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();
