import {
  User,
  Court,
  Customer,
  Booking,
  MembershipPlan,
  Membership,
  Transaction,
  MainCategory,
  Category,
  Venue,
} from "./models";

export async function seedData() {
  await Promise.all([
    User.deleteMany({}),
    Court.deleteMany({}),
    Customer.deleteMany({}),
    Booking.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Membership.deleteMany({}),
    Transaction.deleteMany({}),
    MainCategory.deleteMany({}),
    Category.deleteMany({}),
    Venue.deleteMany({}),
  ]);

  const admin = await User.create({
    username: "admin",
    email: "admin@venue.com",
    firstName: "Admin",
    lastName: "User",
    role: "manager",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  });

  const mcSports = await MainCategory.create({
    title: "Sports",
    description: "Indoor and outdoor sports",
    priority: 1,
    status: "active",
  });
  const mcFitness = await MainCategory.create({
    title: "Fitness",
    description: "Gyms and studios",
    priority: 2,
    status: "active",
  });

  const catBadminton = await Category.create({
    title: "Badminton",
    mainCategoryId: mcSports._id,
    priority: 1,
    status: "active",
  });
  const catCricket = await Category.create({
    title: "Cricket Turf",
    mainCategoryId: mcSports._id,
    priority: 2,
    status: "active",
  });
  const catGym = await Category.create({
    title: "Gym",
    mainCategoryId: mcFitness._id,
    priority: 1,
    status: "active",
  });

  const court1 = await Court.create({
    name: "Badminton Court 1",
    sport: "Badminton",
    description: "Standard synthetic court",
    hourlyRate: "500",
    imageUrl: "https://images.unsplash.com/photo-1626224583764-847890e045b5?w=800&q=80",
    isActive: true,
    timezone: "Asia/Kolkata",
    openingHours: Array.from({ length: 7 }).map((_, i) => ({
      dayOfWeek: i,
      startLocal: "06:00",
      endLocal: "23:00",
    })),
  });

  await Court.create({
    name: "Cricket Turf A",
    sport: "Cricket",
    description: "Box cricket turf",
    hourlyRate: "1200",
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    isActive: true,
    timezone: "Asia/Kolkata",
    openingHours: Array.from({ length: 7 }).map((_, i) => ({
      dayOfWeek: i,
      startLocal: "06:00",
      endLocal: "23:00",
    })),
  });

  const customer1 = await Customer.create({
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    tags: ["VIP"],
    totalSpend: "0",
  });

  const plan = await MembershipPlan.create({
    name: "Gold Member",
    description: "Monthly access pass",
    durationDays: 30,
    price: "3000",
    discountPercent: 10,
    freeHours: 5,
  });

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  await Membership.create({
    customerId: customer1._id,
    planId: plan._id,
    startDate: today.toISOString().split("T")[0],
    endDate: nextMonth.toISOString().split("T")[0],
    status: "active",
    paidAmount: "3000",
    paymentMethod: "upi",
  });

  await Booking.create({
    courtId: court1._id,
    customerId: customer1._id,
    date: today.toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:00",
    duration: 60,
    totalAmount: "500",
    paidAmount: "0",
    paymentStatus: "pending",
    status: "confirmed",
    bookedById: admin._id,
  });

  await Venue.create([
    {
      title: "Arena One",
      location: "Bengaluru, India",
      isFav: true,
      shareableLink: "https://example.com/arena-one",
      mainCategoryId: mcSports._id,
      categoryId: catBadminton._id,
      images: ["https://images.unsplash.com/photo-1599050121792-0b8c38d1b4d8?w=800&q=80"],
      aboutVenue: {
        contactDetails: "+91-98765-43210",
        bio: "Premium indoor badminton arena with synthetic courts.",
        operationalHours: "06:00 - 23:00",
      },
      amenities: ["Parking", "Locker", "Refreshments"],
      direction: "Near MG Road Metro Station",
      price: "500",
      reviews: [{ username: "Ravi", stars: 5, text: "Great courts and lighting" }],
    },
    {
      title: "City Box Cricket",
      location: "Mumbai, India",
      isFav: false,
      shareableLink: "https://example.com/city-box-cricket",
      mainCategoryId: mcSports._id,
      categoryId: catCricket._id,
      images: ["https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80"],
      aboutVenue: {
        contactDetails: "+91-99887-76655",
        bio: "Floodlit box cricket turf ideal for 6-a-side.",
        operationalHours: "07:00 - 01:00",
      },
      amenities: ["Parking", "Scoreboard", "Dressing Rooms"],
      direction: "Andheri East, near Metro",
      price: "1200",
      reviews: [{ username: "Kiran", stars: 4, text: "Good turf, can improve washrooms" }],
    },
    {
      title: "Pulse Fitness Studio",
      location: "Pune, India",
      isFav: true,
      shareableLink: "https://example.com/pulse-fitness",
      mainCategoryId: mcFitness._id,
      categoryId: catGym._id,
      images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80"],
      aboutVenue: {
        contactDetails: "+91-90000-11122",
        bio: "Boutique gym with personal training and HIIT classes.",
        operationalHours: "05:30 - 23:30",
      },
      amenities: ["Shower", "Towel Service", "Parking"],
      direction: "Koregaon Park, Lane 5",
      price: "1500",
      reviews: [{ username: "Anita", stars: 5, text: "Trainers are amazing!" }],
    },
  ]);

  return { mainCategories: await MainCategory.countDocuments(), categories: await Category.countDocuments(), venues: await Venue.countDocuments() };
}
