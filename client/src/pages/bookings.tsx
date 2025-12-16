import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Link } from "wouter";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import type { Court, Booking, Customer, BlockedSlot } from "@shared/schema";
import { getCalendarSlotColor, getPaymentStatusColor, TIME_SLOTS, BOOKING_COLOR_LEGEND } from "@/lib/constants";
import { QRCodeSVG } from "qrcode.react";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";

type CalendarView = "day" | "week" | "month";

function TimeSlotBlock({
  booking,
  customer,
  onClick,
}: {
  booking: Booking;
  customer?: Customer;
  onClick: () => void;
}) {
  const colorClass = getCalendarSlotColor(booking.paymentStatus, booking.status);
  const isNoShow = booking.status === "no_show";

  return (
    <div
      className={`p-2 rounded-md border cursor-pointer transition-all hover:scale-[1.02] ${colorClass} ${isNoShow ? 'opacity-60' : ''}`}
      onClick={onClick}
      data-testid={`booking-slot-${booking.id}`}
    >
      <div className="flex items-center gap-1 text-xs font-medium truncate">
        {isNoShow && <UserX className="w-3 h-3 text-orange-600" />}
        {customer?.name || "Customer"}
      </div>
      <div className="text-xs text-muted-foreground">
        {booking.startTime} - {booking.endTime}
      </div>
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        {isNoShow ? (
          <Badge variant="outline" className="text-[10px] px-1 bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30">
            No-Show
          </Badge>
        ) : (
          <Badge variant="outline" className={`text-[10px] px-1 ${getPaymentStatusColor(booking.paymentStatus)}`}>
            {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "partial" ? "Partial" : "Pending"}
          </Badge>
        )}
        {customer?.tags.includes("HIGH_RISK") && (
          <Badge variant="outline" className="text-[10px] px-1 bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
            Risk
          </Badge>
        )}
      </div>
    </div>
  );
}

function BlockedSlotBlock({
  reason,
  startTime,
  endTime,
}: {
  reason: string;
  startTime: string;
  endTime: string;
}) {
  return (
    <div className="p-2 rounded-md border bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Blocked</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {startTime} - {endTime}
      </div>
      <div className="text-xs mt-1 truncate text-slate-600 dark:text-slate-300">{reason}</div>
    </div>
  );
}

function BookingDetailDialog({
  booking,
  customer,
  court,
  open,
  onClose,
}: {
  booking: Booking | null;
  customer?: Customer;
  court?: Court;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  
  const markNoShowMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/no-show`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/no-shows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      
      let message = "Booking marked as no-show.";
      if (data?.isBlacklisted) {
        message += " Customer has been blacklisted due to repeated no-shows.";
      } else if (data?.isHighRisk) {
        message += ` Customer flagged as high-risk (${data?.noShowCount} no-shows).`;
      }
      
      toast({
        title: "No-Show Recorded",
        description: message,
        variant: data?.isBlacklisted ? "destructive" : "default",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark no-show",
        variant: "destructive",
      });
    },
  });
  
  if (!booking) return null;

  const isNoShow = booking.status === "no_show";
  const canMarkNoShow = !isNoShow && booking.status !== "completed" && booking.status !== "cancelled";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking Details
            {isNoShow && (
              <Badge variant="destructive" className="text-xs">
                <UserX className="w-3 h-3 mr-1" />
                No-Show
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {court?.name} - {booking.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{customer?.name || "Walk-in Customer"}</p>
              <p className="text-sm text-muted-foreground">{customer?.phone}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {customer?.tags.includes("VIP") && (
                  <Badge className="bg-amber-500 text-white text-xs">VIP</Badge>
                )}
                {customer?.tags.includes("HIGH_RISK") && (
                  <Badge className="bg-red-500 text-white text-xs">High Risk</Badge>
                )}
                {customer && customer.noShowCount > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {customer.noShowCount} no-show{customer.noShowCount > 1 ? "s" : ""}
                  </Badge>
                )}
                {customer?.isBlacklisted && (
                  <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3 w-3" />
                Time
              </div>
              <p className="font-medium">
                {booking.startTime} - {booking.endTime}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CreditCard className="h-3 w-3" />
                Payment
              </div>
              <p className="font-medium">
                ₹{booking.paidAmount} / ₹{booking.totalAmount}
              </p>
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}
              >
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>

          {booking.qrCode && (
            <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-900 rounded-md">
              <QRCodeSVG value={booking.qrCode} size={120} />
              <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" data-testid="button-check-in" disabled={isNoShow}>
              Check In
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-collect-payment">
              Collect Payment
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" data-testid="button-reschedule" disabled={isNoShow}>
              Reschedule
            </Button>
            <Button variant="ghost" className="flex-1 text-destructive" data-testid="button-cancel" disabled={isNoShow}>
              Cancel
            </Button>
          </div>

          {canMarkNoShow && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                  data-testid="button-mark-no-show"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Mark as No-Show
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Confirm No-Show
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will record a no-show for {customer?.name || "this customer"}. 
                    {customer && customer.noShowCount >= 2 && (
                      <span className="block mt-2 text-red-500 font-medium">
                        Warning: This customer already has {customer.noShowCount} no-show(s). 
                        {customer.noShowCount >= 4 
                          ? " They will be blacklisted after this." 
                          : customer.noShowCount >= 2 
                          ? " They will be marked as high-risk." 
                          : ""}
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-no-show">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => markNoShowMutation.mutate(booking.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-confirm-no-show"
                  >
                    {markNoShowMutation.isPending ? "Marking..." : "Confirm No-Show"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Bookings() {
  // Real-time updates
  useRealtime();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("day");
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: courts, isLoading: courtsLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: blockedSlots } = useQuery<BlockedSlot[]>({
    queryKey: ["/api/blocked-slots"],
  });

  const filteredCourts =
    selectedCourt === "all"
      ? courts?.filter((c) => c.isActive)
      : courts?.filter((c) => c.id === selectedCourt && c.isActive);

  const dateStr = format(currentDate, "yyyy-MM-dd");
  
  const dateBlockedSlots = blockedSlots?.filter((bs) => bs.date === dateStr) || [];
  
  const isBookingBlockedBySlot = (booking: Booking) => {
    return dateBlockedSlots.some(
      (bs) =>
        bs.courtId === booking.courtId &&
        booking.startTime < bs.endTime &&
        booking.endTime > bs.startTime
    );
  };
  
  const filteredBookings = bookings?.filter(
    (b) => b.date === dateStr && !isBookingBlockedBySlot(b)
  ) || [];

  const getCustomer = (id: string) => customers?.find((c) => c.id === id);
  const getCourt = (id: string) => courts?.find((c) => c.id === id);

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "day") {
      setCurrentDate(direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Booking Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Manage and view all court bookings
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/walkin">
            <Button data-testid="button-new-booking">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
          <Button variant="outline" data-testid="button-block-slot">
            <Ban className="h-4 w-4 mr-2" />
            Block Slot
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("prev")}
              data-testid="button-prev-date"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {view === "day"
                  ? format(currentDate, "EEEE, MMMM d, yyyy")
                  : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("next")}
              data-testid="button-next-date"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              data-testid="button-today"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger className="w-40" data-testid="select-court-filter">
                <SelectValue placeholder="All Courts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts?.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
              <TabsList>
                <TabsTrigger value="day" data-testid="view-day">Day</TabsTrigger>
                <TabsTrigger value="week" data-testid="view-week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <div className="px-6 pb-4 flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">Payment Status:</span>
          {BOOKING_COLOR_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        <CardContent>
          {courtsLoading || bookingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {view === "day" && (
                <div className="min-w-[600px]">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `80px repeat(${filteredCourts?.length || 1}, 1fr)` }}>
                    <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
                    {filteredCourts?.map((court) => (
                      <div key={court.id} className="text-sm font-medium p-2 text-center bg-muted rounded-t-md">
                        {court.name}
                        <span className="block text-xs text-muted-foreground">{court.sport}</span>
                      </div>
                    ))}
                  </div>

                  {TIME_SLOTS.slice(0, 28).map((slot) => (
                    <div
                      key={slot.value}
                      className="grid gap-4 border-t border-border py-1"
                      style={{ gridTemplateColumns: `80px repeat(${filteredCourts?.length || 1}, 1fr)` }}
                    >
                      <div className="text-xs text-muted-foreground p-2">{slot.label}</div>
                      {filteredCourts?.map((court) => {
                        const slotBlocked = dateBlockedSlots.filter(
                          (bs) =>
                            bs.courtId === court.id &&
                            bs.startTime <= slot.value &&
                            bs.endTime > slot.value
                        );
                        
                        const slotBookings = filteredBookings.filter(
                          (b) =>
                            b.courtId === court.id &&
                            b.startTime <= slot.value &&
                            b.endTime > slot.value
                        );

                        return (
                          <div key={court.id} className="min-h-[60px] p-1">
                            {slotBlocked.map((blocked) => (
                              <BlockedSlotBlock
                                key={blocked.id}
                                reason={blocked.reason}
                                startTime={blocked.startTime}
                                endTime={blocked.endTime}
                              />
                            ))}
                            {slotBookings.map((booking) => (
                              <TimeSlotBlock
                                key={booking.id}
                                booking={booking}
                                customer={getCustomer(booking.customerId)}
                                onClick={() => setSelectedBooking(booking)}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {view === "week" && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Week view coming soon</p>
                  <p className="text-sm">Use day view for now</p>
                </div>
              )}
            </div>
          )}

          {(!filteredCourts || filteredCourts.length === 0) && !courtsLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courts available</p>
              <Link href="/settings">
                <Button variant="ghost" className="mt-2" data-testid="link-add-courts">
                  Add Courts in Settings
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingDetailDialog
        booking={selectedBooking}
        customer={selectedBooking ? getCustomer(selectedBooking.customerId) : undefined}
        court={selectedBooking ? getCourt(selectedBooking.courtId) : undefined}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
