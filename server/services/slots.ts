import { DateTime } from "luxon";
import { Booking } from "../models";
import { Hold, OfflineBlock } from "../models.slotting";

const STEP_MIN = 15;

export async function getAvailableSlots(
  venue: any,
  from: string,
  to: string,
  serviceDuration: number,
) {
  const rangeStart = new Date(`${from}T00:00:00Z`);
  const rangeEnd = new Date(`${to}T23:59:59Z`);
  const busy = await fetchBusy(venue._id, rangeStart, rangeEnd);

  const slots: { startAtUtc: Date; endAtUtc: Date; state: string }[] = [];
  const tz = venue.timezone || "UTC";
  const fromLocal = DateTime.fromISO(from, { zone: tz });
  const toLocal = DateTime.fromISO(to, { zone: tz });

  for (let day = fromLocal; day <= toLocal; day = day.plus({ days: 1 })) {
    const windows = openingWindowsForDay(venue.openingHours || [], day.weekday % 7);
    for (const w of windows) {
      const winStart = DateTime.fromISO(`${day.toISODate()}T${w.startLocal}`, { zone: tz }).toUTC();
      const winEnd = DateTime.fromISO(`${day.toISODate()}T${w.endLocal}`, { zone: tz }).toUTC();
      for (let cursor = winStart; cursor.plus({ minutes: serviceDuration }) <= winEnd; cursor = cursor.plus({ minutes: STEP_MIN })) {
        const start = cursor.toJSDate();
        const end = cursor.plus({ minutes: serviceDuration }).toJSDate();
        const overlaps = busy.some((b) => (b.start as Date) < end && (b.end as Date) > start);
        if (!overlaps) slots.push({ startAtUtc: start, endAtUtc: end, state: "available" });
      }
    }
  }
  return slots;
}

function openingWindowsForDay(openingHours: any[], dow: number) {
  const windows = openingHours.filter((w: any) => w.dayOfWeek === dow);
  if (windows.length === 0) {
    // fallback full-day availability if no schedule provided
    return [{ dayOfWeek: dow, startLocal: "00:00", endLocal: "23:59" }];
  }
  return windows;
}

async function fetchBusy(venueId: any, start: Date, end: Date) {
  const now = new Date();
  const [bookings, holds, offline] = await Promise.all([
    Booking.find({
      venueId,
      startAtUtc: { $lt: end },
      endAtUtc: { $gt: start },
      status: "confirmed",
    }),
    Hold.find({ venueId, startAtUtc: { $lt: end }, endAtUtc: { $gt: start }, status: "active", expiresAtUtc: { $gt: now } }),
    OfflineBlock.find({ venueId, startAtUtc: { $lt: end }, endAtUtc: { $gt: start } }),
  ]);

  return [
    ...bookings.map((b) => ({ start: b.startAtUtc, end: b.endAtUtc, type: "booked" })),
    ...holds.map((h) => ({ start: h.startAtUtc, end: h.endAtUtc, type: "held" })),
    ...offline.map((o) => ({ start: o.startAtUtc, end: o.endAtUtc, type: "offline" })),
  ];
}
