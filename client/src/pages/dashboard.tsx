import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarPlus,
  Ban,
  Receipt,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link } from "wouter";
import type { DashboardStats, Court, Booking } from "@shared/schema";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getPaymentStatusColor, getBookingStatusColor } from "@/lib/constants";
import { useRealtime } from "@/hooks/use-realtime";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend && (
              <>
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
                  {trendValue}
                </span>
              </>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourtStatusCard({ court, bookings }: { court: Court; bookings: Booking[] }) {
  const now = new Date();
  const currentTime = format(now, "HH:mm");
  const today = format(now, "yyyy-MM-dd");

  const todayBookings = bookings.filter(
    (b) => b.courtId === court.id && b.date === today
  );

  const currentBooking = todayBookings.find(
    (b) => b.startTime <= currentTime && b.endTime > currentTime
  );

  const nextBooking = todayBookings
    .filter((b) => b.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const isOccupied = !!currentBooking;

  return (
    <Card className={isOccupied ? "border-green-500/50" : "border-muted"}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{court.name}</h3>
          <Badge variant={isOccupied ? "default" : "secondary"} className="text-xs">
            {isOccupied ? "Occupied" : "Available"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{court.sport}</p>
        {currentBooking && (
          <div className="text-xs">
            <span className="text-muted-foreground">Current: </span>
            <span>
              {currentBooking.startTime} - {currentBooking.endTime}
            </span>
          </div>
        )}
        {nextBooking && (
          <div className="text-xs mt-1">
            <span className="text-muted-foreground">Next: </span>
            <span>
              {nextBooking.startTime} - {nextBooking.endTime}
            </span>
          </div>
        )}
        {!currentBooking && !nextBooking && (
          <div className="text-xs text-muted-foreground">No bookings today</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="w-full h-auto py-4 flex flex-col gap-2"
        data-testid={`quick-action-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Button>
    </Link>
  );
}

function RecentBookingRow({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.notes || `Booking #${booking.id.slice(0, 8)}`}</p>
        <p className="text-xs text-muted-foreground">
          {booking.date} | {booking.startTime} - {booking.endTime}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}
        >
          {booking.paymentStatus}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs ${getBookingStatusColor(booking.status)}`}
        >
          {booking.status}
        </Badge>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Real-time updates via WebSocket
  const { isConnected } = useRealtime();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: courts, isLoading: courtsLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todayBookings = bookings?.filter((b) => b.date === today) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Command Center</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1" data-testid="status-realtime">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1 text-green-500" />
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1 text-muted-foreground" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Today's Bookings"
              value={stats?.totalBookingsToday || 0}
              icon={CalendarPlus}
              subtitle="bookings today"
            />
            <StatCard
              title="Today's Revenue"
              value={`₹${(stats?.totalRevenueToday || 0).toLocaleString()}`}
              icon={DollarSign}
              trend="up"
              trendValue="+12%"
            />
            <StatCard
              title="Pending Check-ins"
              value={stats?.pendingCheckIns || 0}
              icon={Clock}
              subtitle="awaiting arrival"
            />
            <StatCard
              title="Pending Payments"
              value={stats?.pendingPayments || 0}
              icon={AlertCircle}
              subtitle="to collect"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Court Status</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {courts?.filter((c) => c.isActive).length || 0} / {courts?.length || 0} Active
            </Badge>
          </CardHeader>
          <CardContent>
            {courtsLoading || bookingsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {courts?.filter((c) => c.isActive).map((court) => (
                  <CourtStatusCard
                    key={court.id}
                    court={court}
                    bookings={bookings || []}
                  />
                ))}
                {(!courts || courts.length === 0) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No courts configured</p>
                    <Link href="/settings">
                      <Button variant="ghost" className="mt-2 underline text-primary" data-testid="link-add-courts">
                        Add Courts
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                icon={CalendarPlus}
                label="New Booking"
                href="/walkin"
              />
              <QuickActionButton icon={Ban} label="Block Slot" href="/bookings" />
              <QuickActionButton
                icon={Receipt}
                label="Add Expense"
                href="/financials"
              />
              <QuickActionButton
                icon={Users}
                label="Add Customer"
                href="/customers"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={
                    stats?.weeklyRevenue || [
                      { day: "Mon", revenue: 0 },
                      { day: "Tue", revenue: 0 },
                      { day: "Wed", revenue: 0 },
                      { day: "Thu", revenue: 0 },
                      { day: "Fri", revenue: 0 },
                      { day: "Sat", revenue: 0 },
                      { day: "Sun", revenue: 0 },
                    ]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {(stats?.weeklyRevenue || []).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="hsl(var(--primary))"
                        opacity={0.8 + index * 0.02}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Today's Bookings</CardTitle>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" data-testid="link-view-all-bookings">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : todayBookings.length > 0 ? (
              <div className="space-y-1">
                {todayBookings.slice(0, 5).map((booking) => (
                  <RecentBookingRow key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings today</p>
                <Link href="/walkin">
                  <Button variant="ghost" className="mt-2 underline text-primary" data-testid="link-create-first-booking">
                    Create first booking
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
