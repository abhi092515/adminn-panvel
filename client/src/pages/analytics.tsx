import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";
import type { DashboardStats, Court, Booking, Customer } from "@shared/schema";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

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
        <div className="text-2xl font-bold" data-testid={`analytics-${title.toLowerCase().replace(/\s/g, '-')}`}>
          {value}
        </div>
        {(subtitle || trend) && (
          <p className={`text-xs mt-1 ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
            {trend && `${trend === "up" ? "+" : "-"}${trendValue} `}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: courts } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const totalRevenue = bookings?.reduce(
    (sum, b) => sum + Number(b.paidAmount),
    0
  ) || 0;

  const averageBookingValue = bookings?.length
    ? Math.round(totalRevenue / bookings.length)
    : 0;

  const completedBookings = bookings?.filter(
    (b) => b.status === "completed" || b.status === "checked_in"
  ).length || 0;

  const noShowRate = bookings?.length
    ? Math.round(
        (bookings.filter((b) => b.status === "no_show").length / bookings.length) * 100
      )
    : 0;

  const sportBreakdown = courts?.map((court) => ({
    name: court.sport,
    bookings: bookings?.filter((b) => b.courtId === court.id).length || 0,
  })) || [];

  const paymentMethodData = [
    { name: "Cash", value: bookings?.filter((b) => b.paymentMethod === "cash").length || 0 },
    { name: "UPI", value: bookings?.filter((b) => b.paymentMethod === "upi").length || 0 },
    { name: "Card", value: bookings?.filter((b) => b.paymentMethod === "card").length || 0 },
    { name: "Online", value: bookings?.filter((b) => b.paymentMethod === "online").length || 0 },
  ].filter((d) => d.value > 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayBookings = bookings?.filter((b) => b.date === dateStr) || [];
    return {
      day: format(date, "EEE"),
      bookings: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + Number(b.paidAmount), 0),
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Track performance metrics and business insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || bookingsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              trend="up"
              trendValue="12%"
              subtitle="vs last month"
            />
            <StatCard
              title="Total Bookings"
              value={bookings?.length || 0}
              icon={Calendar}
              trend="up"
              trendValue="8%"
              subtitle="vs last month"
            />
            <StatCard
              title="Average Booking"
              value={`₹${averageBookingValue}`}
              icon={Target}
              subtitle="per booking"
            />
            <StatCard
              title="Total Customers"
              value={customers?.length || 0}
              icon={Users}
              trend="up"
              trendValue="15%"
              subtitle="vs last month"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No payment data
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {paymentMethodData.map((method, i) => (
                <div key={method.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span>{method.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completion Rate</span>
              </div>
              <Badge variant="secondary">
                {bookings?.length
                  ? Math.round((completedBookings / bookings.length) * 100)
                  : 0}
                %
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">No-Show Rate</span>
              </div>
              <Badge variant="secondary">{noShowRate}%</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Repeat Customers</span>
              </div>
              <Badge variant="secondary">
                {customers?.filter((c) => c.totalBookings > 1).length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm">Paid Rate</span>
              </div>
              <Badge variant="secondary">
                {bookings?.length
                  ? Math.round(
                      (bookings.filter((b) => b.paymentStatus === "paid").length /
                        bookings.length) *
                        100
                    )
                  : 0}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {customers
                  ?.sort((a, b) => Number(b.totalSpend) - Number(a.totalSpend))
                  .slice(0, 5)
                  .map((customer, i) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-muted"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.totalBookings} bookings
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        ₹{Number(customer.totalSpend).toLocaleString()}
                      </div>
                    </div>
                  )) || (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No customer data
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
