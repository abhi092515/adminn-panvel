// WhatsApp notification stubs (integrate with WhatsApp Business API in production)
export const sendWhatsAppNotification = async (
  phone: string,
  template: string,
  data: Record<string, unknown>,
) => {
  console.log(`[WhatsApp Notification] To: ${phone}, Template: ${template}`, data);
  return {
    success: true,
    messageId: `wa_${Date.now()}`,
    template,
    phone,
  };
};

export const sendBookingConfirmation = async (
  phone: string,
  bookingDetails: {
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    courtName?: string;
    amount: number;
    qrCode?: string;
  },
) => {
  return sendWhatsAppNotification(phone, "booking_confirmation", {
    ...bookingDetails,
    message: `Your booking is confirmed for ${bookingDetails.date} at ${bookingDetails.startTime}. Your booking ID: ${bookingDetails.bookingId.slice(0, 8).toUpperCase()}`,
  });
};

export const sendPaymentReminder = async (
  phone: string,
  paymentDetails: {
    bookingId: string;
    amount: number;
    dueDate: string;
    paymentLink?: string;
  },
) => {
  return sendWhatsAppNotification(phone, "payment_reminder", {
    ...paymentDetails,
    message: `Payment reminder: ₹${paymentDetails.amount} due for booking #${paymentDetails.bookingId.slice(0, 8).toUpperCase()}`,
  });
};

export const sendSlotReminder = async (
  phone: string,
  reminderDetails: {
    bookingId: string;
    date: string;
    startTime: string;
    courtName?: string;
  },
) => {
  return sendWhatsAppNotification(phone, "slot_reminder", {
    ...reminderDetails,
    message: `Reminder: Your slot is coming up in 1 hour at ${reminderDetails.startTime}`,
  });
};

export const sendWaitlistNotification = async (
  phone: string,
  slotDetails: {
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
  },
) => {
  return sendWhatsAppNotification(phone, "waitlist_available", {
    ...slotDetails,
    message: `Good news! A slot is now available on ${slotDetails.date} at ${slotDetails.startTime}. Book now before it's gone!`,
  });
};

export const sendNoShowWarning = async (phone: string, noShowCount: number) => {
  let warningLevel = "warning";
  let consequence = "";

  if (noShowCount >= 5) {
    warningLevel = "blacklisted";
    consequence = "Your account has been restricted due to multiple no-shows.";
  } else if (noShowCount >= 3) {
    warningLevel = "high_risk";
    consequence = `You have ${5 - noShowCount} more no-shows before your account is restricted.`;
  } else {
    consequence = "Please make sure to show up for your future bookings.";
  }

  return sendWhatsAppNotification(phone, "no_show_warning", {
    noShowCount,
    warningLevel,
    message: `Notice: You have ${noShowCount} recorded no-show(s). ${consequence}`,
  });
};
