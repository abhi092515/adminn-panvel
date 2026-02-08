import mongoose from "mongoose";

// Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    password: { type: String }, // optional, for local auth
    role: { type: String, default: "customer" }, // admin, staff, customer
    profileImageUrl: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const courtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sport: { type: String, required: true },
    description: String,
    hourlyRate: { type: String, required: true },
    peakHourlyRate: String,
    isActive: { type: Boolean, default: true },
    imageUrl: String,
    timezone: { type: String, default: "UTC" },
    openingHours: {
        type: [
            {
                dayOfWeek: { type: Number, min: 0, max: 6 },
                startLocal: String,
                endLocal: String,
            },
        ],
        default: [],
    },
});

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: String,
    totalSpend: { type: String, default: "0" },
    totalBookings: { type: Number, default: 0 },
    noShowCount: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    notes: String,
    isBlacklisted: { type: Boolean, default: false },
    source: { type: String, default: "walkin" },
});

const bookingSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    bookedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startAtUtc: { type: Date },
    endAtUtc: { type: Date },
    duration: { type: Number, required: true },
    totalAmount: { type: String, required: true },
    paidAmount: { type: String, default: "0" },
    paymentStatus: { type: String, default: "pending" },
    paymentMethod: String,
    status: { type: String, default: "confirmed" },
    qrCode: String,
    notes: String,
    isTeamBooking: { type: Boolean, default: false },
    teamName: String,
    createdAt: { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    type: { type: String, required: true },
    amount: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: "completed" },
    notes: String,
    processedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

const settlementSchema = new mongoose.Schema({
    amount: { type: String, required: true },
    commissionRate: { type: String, default: "5.00" },
    status: { type: String, default: "pending" },
    periodStart: { type: String, required: true },
    periodEnd: { type: String, required: true },
    totalBookings: { type: Number, default: 0 },
    totalCashReceived: { type: String, default: "0" },
    paidAt: Date,
    createdAt: { type: Date, default: Date.now },
});

const waitlistSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: String, required: true },
    preferredStartTime: { type: String, required: true },
    preferredEndTime: { type: String, required: true },
    status: { type: String, default: "waiting" },
    notifiedAt: Date,
    createdAt: { type: Date, default: Date.now },
});

const blockedSlotSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true },
    blockedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sport: { type: String, required: true },
    entryFee: { type: String, default: "0" },
    maxTeams: { type: Number, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, default: "upcoming" },
    description: String,
    prizePool: String,
    createdAt: { type: Date, default: Date.now },
});

const tournamentTeamSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    name: { type: String, required: true },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    players: { type: [String], default: [] },
    isPaid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const tournamentMatchSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    round: { type: Number, default: 1 },
    matchNumber: { type: Number, required: true },
    team1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentTeam' },
    team2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentTeam' },
    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentTeam' },
    status: { type: String, default: "scheduled" },
    scheduledTime: String,
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' },
    notes: String,
    createdAt: { type: Date, default: Date.now },
});

const maintenanceLogSchema = new mongoose.Schema({
    courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    issue: { type: String, required: true },
    description: String,
    photoUrl: String,
    status: { type: String, default: "reported" },
    reportedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date,
});

const expenseSchema = new mongoose.Schema({
    category: { type: String, required: true },
    amount: { type: String, required: true },
    description: String,
    date: { type: String, required: true },
    addedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

const membershipPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    durationDays: { type: Number, required: true },
    price: { type: String, required: true },
    discountPercent: { type: Number, default: 0 },
    freeHours: { type: Number, default: 0 },
    priority: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const membershipSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, default: "active" },
    usedFreeHours: { type: Number, default: 0 },
    paidAmount: { type: String, required: true },
    paymentMethod: String,
    createdAt: { type: Date, default: Date.now },
});

const loyaltyPointsSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
});

const reviewSubSchema = new mongoose.Schema(
  {
    image: String,
    username: { type: String, required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    text: String,
  },
  { _id: false },
);

const venueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    isFav: { type: Boolean, default: false },
    shareableLink: String,
    mainCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    images: { type: [String], default: [] },
    aboutVenue: {
        contactDetails: String,
        bio: String,
        operationalHours: String,
    },
    amenities: { type: [String], default: [] },
    direction: String,
    reviews: { type: [reviewSubSchema], default: [] },
    price: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const mainCategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: String,
    priority: Number,
    description: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: String,
    priority: Number,
    description: String,
    status: String,
    mainCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MainCategory' },
    createdAt: { type: Date, default: Date.now },
});

// Models
export const User = mongoose.model("User", userSchema);
export const Court = mongoose.model("Court", courtSchema);
export const Customer = mongoose.model("Customer", customerSchema);
export const Booking = mongoose.model("Booking", bookingSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export const Settlement = mongoose.model("Settlement", settlementSchema);
export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
export const BlockedSlot = mongoose.model("BlockedSlot", blockedSlotSchema);
export const Tournament = mongoose.model("Tournament", tournamentSchema);
export const TournamentTeam = mongoose.model("TournamentTeam", tournamentTeamSchema);
export const TournamentMatch = mongoose.model("TournamentMatch", tournamentMatchSchema);
export const MaintenanceLog = mongoose.model("MaintenanceLog", maintenanceLogSchema);
export const Expense = mongoose.model("Expense", expenseSchema);
export const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);
export const Membership = mongoose.model("Membership", membershipSchema);
export const LoyaltyPoints = mongoose.model("LoyaltyPoints", loyaltyPointsSchema);
export const Venue = mongoose.model("Venue", venueSchema);
export const MainCategory = mongoose.model("MainCategory", mainCategorySchema);
export const Category = mongoose.model("Category", categorySchema);

bookingSchema.index({ courtId: 1, startAtUtc: 1, endAtUtc: 1, status: 1 });
