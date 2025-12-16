import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("receptionist"), // owner, manager, receptionist
  phone: varchar("phone"),
  isActive: varchar("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Role permissions for RBAC
export const rolePermissions = {
  owner: [
    "manage_staff",
    "manage_settings",
    "view_financials",
    "manage_settlements",
    "manage_courts",
    "manage_bookings",
    "manage_customers",
    "view_analytics",
    "manage_tournaments",
  ],
  manager: [
    "view_financials",
    "manage_courts",
    "manage_bookings",
    "manage_customers",
    "view_analytics",
    "manage_tournaments",
  ],
  receptionist: [
    "manage_bookings",
    "manage_customers",
    "view_today_schedule",
  ],
} as const;

export type UserRole = keyof typeof rolePermissions;
export type Permission = (typeof rolePermissions)[UserRole][number];
