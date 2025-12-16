export const SPORTS = [
  { value: "cricket", label: "Cricket" },
  { value: "football", label: "Football" },
  { value: "badminton", label: "Badminton" },
  { value: "tennis", label: "Tennis" },
  { value: "basketball", label: "Basketball" },
  { value: "volleyball", label: "Volleyball" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
] as const;

export const BOOKING_STATUSES = [
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "checked_in", label: "Checked In", color: "bg-green-500" },
  { value: "completed", label: "Completed", color: "bg-gray-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { value: "no_show", label: "No Show", color: "bg-orange-500" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "text-red-500 dark:text-red-400" },
  { value: "partial", label: "Partial", color: "text-orange-500 dark:text-orange-400" },
  { value: "paid", label: "Paid", color: "text-green-500 dark:text-green-400" },
] as const;

export const CUSTOMER_TAGS = [
  { value: "VIP", label: "VIP", color: "bg-amber-500 text-white" },
  { value: "HIGH_RISK", label: "High Risk", color: "bg-red-500 text-white" },
  { value: "REGULAR", label: "Regular", color: "bg-blue-500 text-white" },
  { value: "NEW", label: "New", color: "bg-green-500 text-white" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "electricity", label: "Electricity" },
  { value: "staff", label: "Staff Salaries" },
  { value: "maintenance", label: "Maintenance" },
  { value: "equipment", label: "Equipment" },
  { value: "rent", label: "Rent" },
  { value: "other", label: "Other" },
] as const;

export const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = i % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
  const label = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
  return { value: time, label };
});

export const DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
] as const;

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    case "partial":
      return "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "pending":
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
  }
};

export const getBookingStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "checked_in":
      return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    case "completed":
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
    case "no_show":
      return "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
  }
};

// 4-state color system per design guidelines:
// Green = Paid, Orange = Partial, Red = Pending, Grey = Blocked
export const getCalendarSlotColor = (paymentStatus: string, status: string, isBlocked?: boolean) => {
  // Grey for blocked/maintenance slots
  if (isBlocked || status === "blocked") {
    return "bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500";
  }
  if (status === "cancelled" || status === "no_show") {
    return "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600";
  }
  switch (paymentStatus) {
    case "paid":
      return "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600";
    case "partial":
      return "bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600";
    case "pending":
      return "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600";
    default:
      return "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600";
  }
};

// Status legend for calendar
export const BOOKING_COLOR_LEGEND = [
  { label: "Paid", color: "bg-green-500", bgClass: "bg-green-100 dark:bg-green-900/40" },
  { label: "Partial", color: "bg-orange-500", bgClass: "bg-orange-100 dark:bg-orange-900/40" },
  { label: "Pending", color: "bg-red-500", bgClass: "bg-red-100 dark:bg-red-900/40" },
  { label: "Blocked", color: "bg-slate-500", bgClass: "bg-slate-200 dark:bg-slate-700" },
] as const;

// Returns sport abbreviation for display (no emojis per design guidelines)
export const getSportAbbrev = (sport: string) => {
  switch (sport.toLowerCase()) {
    case "cricket":
      return "CRI";
    case "football":
      return "FTB";
    case "badminton":
      return "BAD";
    case "tennis":
      return "TEN";
    case "basketball":
      return "BKB";
    case "volleyball":
      return "VLB";
    default:
      return "SPT";
  }
};
