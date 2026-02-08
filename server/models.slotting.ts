import mongoose from "mongoose";

export const HoldSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", index: true, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  startAtUtc: { type: Date, required: true, index: true },
  endAtUtc: { type: Date, required: true, index: true },
  status: { type: String, enum: ["active", "consumed", "expired"], default: "active", index: true },
  expiresAtUtc: { type: Date, required: true },
  idempotencyKey: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
}, { versionKey: false });

export const OfflineBlockSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", index: true, required: true },
  startAtUtc: { type: Date, required: true, index: true },
  endAtUtc: { type: Date, required: true, index: true },
  reason: String,
  createdAt: { type: Date, default: () => new Date() },
}, { versionKey: false });

export const SlotLockSchema = new mongoose.Schema({
  slotKey: { type: String, required: true, unique: true },
  expiresAtUtc: { type: Date, required: true },
  holdId: { type: mongoose.Schema.Types.ObjectId, ref: "Hold" },
}, { versionKey: false });

// Indexes
HoldSchema.index({ venueId: 1, startAtUtc: 1, endAtUtc: 1, status: 1 });
HoldSchema.index({ expiresAtUtc: 1 }, { expireAfterSeconds: 0 });
HoldSchema.index({ customerId: 1, venueId: 1, idempotencyKey: 1 }, { unique: true });

OfflineBlockSchema.index({ venueId: 1, startAtUtc: 1, endAtUtc: 1 });

SlotLockSchema.index({ expiresAtUtc: 1 }, { expireAfterSeconds: 0 });

export const Hold = mongoose.model("Hold", HoldSchema);
export const OfflineBlock = mongoose.model("OfflineBlock", OfflineBlockSchema);
export const SlotLock = mongoose.model("SlotLock", SlotLockSchema);
