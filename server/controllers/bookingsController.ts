import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import { insertBookingSchema } from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";
import { sendBookingConfirmation, sendNoShowWarning } from "../utils/notifications";

function computeDuration(startTime?: string, endTime?: string, duration?: number) {
  if (duration || !startTime || !endTime) return duration;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}

export const listBookings = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const bookings = date
    ? await storage.getBookingsByDate(date as string)
    : await storage.getBookings();
  res.json(bookings);
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await storage.getBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  res.json(booking);
});

export const createBooking = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    const data = { ...result.data } as any;
    data.duration = computeDuration(data.startTime, data.endTime, data.duration);

    const booking = await storage.createBooking(data);

    if (data.paidAmount && Number(data.paidAmount) > 0) {
      await storage.createTransaction({
        bookingId: booking.id,
        customerId: booking.customerId,
        type: "booking_payment",
        amount: data.paidAmount,
        paymentMethod: data.paymentMethod || "cash",
        status: "completed",
      });
    }

    const customer = await storage.getCustomer(booking.customerId);
    if (customer?.phone) {
      await sendBookingConfirmation(customer.phone, {
        bookingId: booking.id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        amount: Number(booking.totalAmount),
        qrCode: booking.qrCode || undefined,
      });
    }

    broadcast("booking_created", booking);
    res.status(201).json(booking);
  });

export const updateBooking = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const booking = await storage.updateBooking(req.params.id, req.body);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    broadcast("booking_updated", booking);
    res.json(booking);
  });

export const deleteBooking = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteBooking(req.params.id);
    broadcast("booking_deleted", { id: req.params.id });
    res.status(204).send();
  });

export const markNoShow = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const booking = await storage.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "no_show") {
      return res.status(400).json({ message: "Booking already marked as no-show" });
    }

    const customer = await storage.getCustomer(booking.customerId);
    if (!customer) {
      const updatedBooking = await storage.updateBooking(req.params.id, { status: "no_show" });
      broadcast("booking_updated", updatedBooking);
      return res.json({ booking: updatedBooking, noShowCount: 0, isHighRisk: false, isBlacklisted: false, warning: "Customer record not found - no-show tracking not applied" });
    }

    const updatedBooking = await storage.updateBooking(req.params.id, { status: "no_show" });
    const newNoShowCount = customer.noShowCount + 1;
    const updatedTags = Array.from(new Set(customer.tags || []));
    const isHighRisk = newNoShowCount >= 3;
    if (isHighRisk && !updatedTags.includes("HIGH_RISK")) {
      updatedTags.push("HIGH_RISK");
    }
    const isBlacklisted = newNoShowCount >= 5;
    const shouldBlacklist = isBlacklisted || customer.isBlacklisted;

    const updatedCustomer = await storage.updateCustomer(
      booking.customerId,
      {
        noShowCount: newNoShowCount,
        tags: updatedTags,
        isBlacklisted: shouldBlacklist,
      } as any,
    );

    if (updatedCustomer) {
      broadcast("customer_updated", updatedCustomer);
    }

    if (newNoShowCount >= 2 && customer.phone) {
      await sendNoShowWarning(customer.phone, newNoShowCount);
    }

    broadcast("booking_updated", updatedBooking);
    res.json({
      booking: updatedBooking,
      noShowCount: newNoShowCount,
      isHighRisk,
      isBlacklisted,
      customerName: customer.name,
    });
  });
