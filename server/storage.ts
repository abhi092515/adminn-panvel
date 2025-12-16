import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import {
  users, courts, customers, bookings, transactions, settlements,
  waitlist, blockedSlots, tournaments, tournamentTeams, maintenanceLogs, expenses,
  type User, type UpsertUser,
  type Court, type InsertCourt,
  type Customer, type InsertCustomer,
  type Booking, type InsertBooking,
  type Transaction, type InsertTransaction,
  type Settlement, type InsertSettlement,
  type Waitlist, type InsertWaitlist,
  type BlockedSlot, type InsertBlockedSlot,
  type Tournament, type InsertTournament,
  type TournamentTeam, type InsertTournamentTeam,
  type MaintenanceLog, type InsertMaintenanceLog,
  type Expense, type InsertExpense,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  
  // Staff (RBAC)
  getStaff(): Promise<User[]>;
  updateStaffRole(id: string, role: string): Promise<User | undefined>;

  // Courts
  getCourts(): Promise<Court[]>;
  getCourt(id: string): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: string, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: string): Promise<void>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Settlements
  getSettlements(): Promise<Settlement[]>;
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  updateSettlement(id: string, settlement: Partial<InsertSettlement>): Promise<Settlement | undefined>;

  // Waitlist
  getWaitlist(): Promise<Waitlist[]>;
  getWaitlistItem(id: string): Promise<Waitlist | undefined>;
  createWaitlistItem(item: InsertWaitlist): Promise<Waitlist>;
  updateWaitlistItem(id: string, item: Partial<InsertWaitlist>): Promise<Waitlist | undefined>;

  // Blocked Slots
  getBlockedSlots(): Promise<BlockedSlot[]>;
  createBlockedSlot(slot: InsertBlockedSlot): Promise<BlockedSlot>;
  deleteBlockedSlot(id: string): Promise<void>;

  // Tournaments
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<Tournament | undefined>;

  // Tournament Teams
  getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]>;
  createTournamentTeam(team: InsertTournamentTeam): Promise<TournamentTeam>;

  // Maintenance Logs
  getMaintenanceLogs(): Promise<MaintenanceLog[]>;
  createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLog>;
  updateMaintenanceLog(id: string, log: Partial<InsertMaintenanceLog>): Promise<MaintenanceLog | undefined>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: any): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  
  // Staff (RBAC)
  async getStaff(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateStaffRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Courts
  async getCourts(): Promise<Court[]> {
    return db.select().from(courts).orderBy(asc(courts.name));
  }

  async getCourt(id: string): Promise<Court | undefined> {
    const [court] = await db.select().from(courts).where(eq(courts.id, id));
    return court;
  }

  async createCourt(court: InsertCourt): Promise<Court> {
    const [created] = await db.insert(courts).values(court).returning();
    return created;
  }

  async updateCourt(id: string, court: Partial<InsertCourt>): Promise<Court | undefined> {
    const [updated] = await db.update(courts).set(court).where(eq(courts.id, id)).returning();
    return updated;
  }

  async deleteCourt(id: string): Promise<void> {
    await db.delete(courts).where(eq(courts.id, id));
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.totalSpend));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return updated;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.date, date)).orderBy(asc(bookings.startTime));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    
    // Update customer stats
    await db.update(customers)
      .set({
        totalBookings: sql`${customers.totalBookings} + 1`,
        totalSpend: sql`${customers.totalSpend} + ${booking.paidAmount || "0"}`,
      })
      .where(eq(customers.id, booking.customerId));
    
    return created;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  // Settlements
  async getSettlements(): Promise<Settlement[]> {
    return db.select().from(settlements).orderBy(desc(settlements.createdAt));
  }

  async createSettlement(settlement: InsertSettlement): Promise<Settlement> {
    const [created] = await db.insert(settlements).values(settlement).returning();
    return created;
  }

  async updateSettlement(id: string, settlement: Partial<InsertSettlement>): Promise<Settlement | undefined> {
    const [updated] = await db.update(settlements).set(settlement).where(eq(settlements.id, id)).returning();
    return updated;
  }

  // Waitlist
  async getWaitlist(): Promise<Waitlist[]> {
    return db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
  }

  async getWaitlistItem(id: string): Promise<Waitlist | undefined> {
    const [item] = await db.select().from(waitlist).where(eq(waitlist.id, id));
    return item;
  }

  async createWaitlistItem(item: InsertWaitlist): Promise<Waitlist> {
    const [created] = await db.insert(waitlist).values(item).returning();
    return created;
  }

  async updateWaitlistItem(id: string, item: Partial<InsertWaitlist>): Promise<Waitlist | undefined> {
    const [updated] = await db.update(waitlist).set(item).where(eq(waitlist.id, id)).returning();
    return updated;
  }

  // Blocked Slots
  async getBlockedSlots(): Promise<BlockedSlot[]> {
    return db.select().from(blockedSlots).orderBy(desc(blockedSlots.createdAt));
  }

  async createBlockedSlot(slot: InsertBlockedSlot): Promise<BlockedSlot> {
    const [created] = await db.insert(blockedSlots).values(slot).returning();
    return created;
  }

  async deleteBlockedSlot(id: string): Promise<void> {
    await db.delete(blockedSlots).where(eq(blockedSlots.id, id));
  }

  // Tournaments
  async getTournaments(): Promise<Tournament[]> {
    return db.select().from(tournaments).orderBy(desc(tournaments.startDate));
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [created] = await db.insert(tournaments).values(tournament).returning();
    return created;
  }

  async updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<Tournament | undefined> {
    const [updated] = await db.update(tournaments).set(tournament).where(eq(tournaments.id, id)).returning();
    return updated;
  }

  // Tournament Teams
  async getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
    return db.select().from(tournamentTeams).where(eq(tournamentTeams.tournamentId, tournamentId));
  }

  async createTournamentTeam(team: InsertTournamentTeam): Promise<TournamentTeam> {
    const [created] = await db.insert(tournamentTeams).values(team).returning();
    return created;
  }

  // Maintenance Logs
  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    return db.select().from(maintenanceLogs).orderBy(desc(maintenanceLogs.createdAt));
  }

  async createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLog> {
    const [created] = await db.insert(maintenanceLogs).values(log).returning();
    return created;
  }

  async updateMaintenanceLog(id: string, log: Partial<InsertMaintenanceLog>): Promise<MaintenanceLog | undefined> {
    const [updated] = await db.update(maintenanceLogs).set(log).where(eq(maintenanceLogs.id, id)).returning();
    return updated;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }
}

export const storage = new DatabaseStorage();
