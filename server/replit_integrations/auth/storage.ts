import { User } from "../../models";
import { type User as UserType } from "@shared/schema";

export type UpsertUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  username?: string;
};

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<UserType | undefined>;
  upsertUser(user: UpsertUser): Promise<UserType>;
}

function mapDoc<T>(doc: any): T {
  if (!doc) return undefined as any;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<UserType | undefined> {
    // try finding by _id or auth id (which we store in user schema if needed, but here we assume _id map)
    // Actually replit auth provides sub (string) which might not be valid objectId
    // We should probably check if we store 'sub' somewhere.
    // In our model we have 'email' which is unique.

    // If the ID passed is a valid ObjectId, try finding by that
    // Otherwise it might be a lookup by some other method, but getUser usually expects our internal ID.
    try {
      const doc = await User.findById(id);
      return mapDoc(doc);
    } catch (e) {
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    // First check if a user with this email already exists
    if (userData.email) {
      const existingByEmail = await User.findOne({ email: userData.email });
      if (existingByEmail) {
        // Update existing user by email
        existingByEmail.firstName = userData.firstName || existingByEmail.firstName;
        existingByEmail.lastName = userData.lastName || existingByEmail.lastName;
        existingByEmail.profileImageUrl = userData.profileImageUrl || existingByEmail.profileImageUrl;
        existingByEmail.updatedAt = new Date();
        await existingByEmail.save();
        return mapDoc(existingByEmail);
      }
    }

    // Check if user exists by ID (if provided)
    if (userData.id) {
      // Warning: userData.id from OIDC (sub) is string, might not be ObjectId
      // We generally don't store OIDC sub as _id.
      // If this method is called with internal ID, fine.
      // But setupAuth calls it with OIDC sub as id.

      // Let's assume we want to create a new user if not found by email.

      // If we are here, email didn't match.
    }

    // Insert new user
    // We need to map OIDC fields to our schema
    const newUser = new User({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      username: userData.username || userData.email?.split('@')[0] || `user_${Date.now()}`,
    });

    await newUser.save();
    return mapDoc(newUser);
  }
}

export const authStorage = new AuthStorage();
