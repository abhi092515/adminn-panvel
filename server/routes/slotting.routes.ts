import { Router } from "express";
import mongoose from "mongoose";
import { Court, Booking } from "../models";
import { Hold, OfflineBlock, SlotLock } from "../models.slotting";
import { getAvailableSlots } from "../services/slots";

const router = Router();

function toClient(doc: any) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id?.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

router.get("/venues/:venueId/slots", async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const { from, to, serviceDuration = 60 } = req.query as any;
    const venue = await Court.findById(venueId);
    if (!venue) return res.status(404).json({ state: 404, message: "Venue not found", data: null });
    const slots = await getAvailableSlots(venue as any, from, to, Number(serviceDuration));
    res.json({ state: 200, message: "Success", data: slots });
  } catch (err) { next(err); }
});

router.post("/holds", async (req, res, next) => {
  const { venueId, startAtUtc, endAtUtc, customerId, idempotencyKey } = req.body;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const existing = await Hold.findOne({ venueId, customerId, idempotencyKey }).session(session);
      if (existing) return res.status(200).json({ state: 200, message: "Success", data: existing });

      const slotKey = `${venueId}:${startAtUtc}:${endAtUtc}`;
      await SlotLock.create([{ slotKey, expiresAtUtc: addMinutes(new Date(), 6) }], { session })
        .catch((err) => { if (err.code === 11000) throw conflict(); else throw err; });

      const conflictDoc = await findAnyConflict(venueId, startAtUtc, endAtUtc, session);
      if (conflictDoc) throw conflict();

      const hold = (await Hold.create([{
        venueId,
        customerId,
        startAtUtc: new Date(startAtUtc),
        endAtUtc: new Date(endAtUtc),
        expiresAtUtc: addMinutes(new Date(), 5),
        idempotencyKey,
      }], { session }))[0];

      res.status(201).json({ state: 201, message: "Success", data: hold });
    });
  } catch (err) { next(err); } finally { session.endSession(); }
});

router.post("/bookings", async (req, res, next) => {
  const { holdId, paymentRef, customerId } = req.body;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const hold = await Hold.findById(holdId).session(session);
      if (!hold || hold.status !== "active" || hold.expiresAtUtc <= new Date() || String(hold.customerId) !== customerId) {
        throw conflict("Hold invalid or expired");
      }

      const conflictDoc = await findAnyConflict(hold.venueId, hold.startAtUtc, hold.endAtUtc, session, true);
      if (conflictDoc) throw conflict();

      await Hold.updateOne({ _id: holdId }, { $set: { status: "consumed" } }).session(session);
      const bookingDoc = (await Booking.create([{
        venueId: hold.venueId,
        customerId,
        startAtUtc: hold.startAtUtc,
        endAtUtc: hold.endAtUtc,
        status: "confirmed",
        paymentMethod: paymentRef,
        holdId,
      }], { session }))[0];
      const qrCode = `BOOKING:${bookingDoc._id.toString()}`;
      bookingDoc.qrCode = qrCode;
      await bookingDoc.save({ session });

      res.status(201).json({ state: 201, message: "Success", data: toClient(bookingDoc) });
    });
  } catch (err) { next(err); } finally { session.endSession(); }
});

router.post("/venues/:venueId/offline", async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const { startAtUtc, endAtUtc, reason } = req.body;
    const block = await OfflineBlock.create({ venueId, startAtUtc, endAtUtc, reason });
    res.status(201).json({ state: 201, message: "Success", data: block });
  } catch (err) { next(err); }
});

// --- Admin list & update bookings (for scanner / panels) ---
router.get("/bookings", async (_req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ startAtUtc: 1 });
    res.json({ state: 200, message: "Success", data: bookings.map(toClient) });
  } catch (err) { next(err); }
});

router.patch("/bookings/:id", async (req, res, next) => {
  try {
    const update = req.body || {};
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) return res.status(404).json({ state: 404, message: "Not found", data: null });
    res.json({ state: 200, message: "Success", data: toClient(booking) });
  } catch (err) { next(err); }
});

function addMinutes(date: Date, m: number) {
  return new Date(date.getTime() + m * 60000);
}

function conflict(msg = "Conflict") {
  const err: any = new Error(msg);
  err.status = 409;
  return err;
}

async function findAnyConflict(venueId: any, start: any, end: any, session: any, skipHold = false) {
  const filter = { venueId, startAtUtc: { $lt: end }, endAtUtc: { $gt: start } };
  const [b, h, o] = await Promise.all([
    Booking.findOne({ ...filter, status: "confirmed" }).session(session),
    skipHold ? null : Hold.findOne({ ...filter, status: "active", expiresAtUtc: { $gt: new Date() } }).session(session),
    OfflineBlock.findOne(filter).session(session),
  ]);
  return b || h || o;
}

export default router;
