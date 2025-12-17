
import mongoose from "mongoose";
import {
    User, Court, Customer, Booking,
    MembershipPlan, Membership, Transaction
} from "./models";
import { connectDB, disconnectDB } from "./db";

async function seed() {
    await connectDB();
    console.log("Connected to DB for seeding...");

    // clear existing data
    await User.deleteMany({});
    await Court.deleteMany({});
    await Customer.deleteMany({});
    await Booking.deleteMany({});
    await MembershipPlan.deleteMany({});
    await Membership.deleteMany({});
    await Transaction.deleteMany({});

    console.log("Cleared existing data.");

    // Create Admin User
    const admin = await User.create({
        username: "admin",
        email: "admin@venue.com",
        firstName: "Admin",
        lastName: "User",
        role: "manager",
        profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    });

    // Create Courts
    const court1 = await Court.create({
        name: "Badminton Court 1",
        sport: "Badminton",
        description: "Standard synthetic court",
        hourlyRate: "500",
        imageUrl: "https://images.unsplash.com/photo-1626224583764-847890e045b5?w=800&q=80",
        isActive: true
    });

    const court2 = await Court.create({
        name: "Cricket Turf A",
        sport: "Cricket",
        description: "Box cricket turf",
        hourlyRate: "1200",
        imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
        isActive: true
    });

    // Create Customers
    const customer1 = await Customer.create({
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        tags: ["VIP"],
        totalSpend: "0",
    });

    const customer2 = await Customer.create({
        name: "Jane Smith",
        phone: "9988776655",
        tags: ["REGULAR"],
    });

    // Create Membership Plan
    const plan = await MembershipPlan.create({
        name: "Gold Member",
        description: "Monthly access pass",
        durationDays: 30,
        price: "3000",
        discountPercent: 10,
        freeHours: 5,
    });

    // Assign Membership
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    await Membership.create({
        customerId: customer1._id,
        planId: plan._id,
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
        status: "active",
        paidAmount: "3000",
        paymentMethod: "upi",
    });

    // Create Booking
    await Booking.create({
        courtId: court1._id,
        customerId: customer1._id,
        date: today.toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        totalAmount: "500",
        paidAmount: "0",
        paymentStatus: "pending",
        status: "confirmed",
        bookedById: admin._id,
    });

    console.log("Seeding complete!");
    await disconnectDB();
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
