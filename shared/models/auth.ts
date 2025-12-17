import { z } from "zod";

// User schema
export const insertUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  role: z.string().default("receptionist"), // owner, manager, receptionist
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type UpsertUser = z.infer<typeof insertUserSchema>;

export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  phone: string | null;
  isActive: boolean | string; // keeping string for backward compat if needed, but preferable boolean
  createdAt: Date | null;
  updatedAt: Date | null;
};

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
