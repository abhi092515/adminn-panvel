import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Plus,
  Calendar,
  Clock,
  CreditCard,
  Star,
  AlertTriangle,
  Check,
  QrCode,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { Court, Customer, Booking } from "@shared/schema";
import { apiRequest, apiRequestJson, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TIME_SLOTS, DURATIONS, PAYMENT_METHODS } from "@/lib/constants";
import { QRCodeSVG } from "qrcode.react";

const bookingFormSchema = z.object({
  courtId: z.string().min(1, "Please select a court"),
  customerId: z.string().min(1, "Please select a customer"),
  date: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select start time"),
  duration: z.coerce.number().min(30, "Please select duration"),
  paymentMethod: z.string().optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

function CustomerSearchCombobox({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedCustomer = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid="select-customer"
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                {selectedCustomer.name.charAt(0)}
              </div>
              <span>{selectedCustomer.name}</span>
              <span className="text-muted-foreground text-xs">
                {selectedCustomer.phone}
              </span>
              {selectedCustomer.tags.includes("VIP") && (
                <Badge className="bg-amber-500 text-white text-xs ml-1">
                  <Star className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Search customer...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or phone..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.phone}`}
                  onSelect={() => {
                    onChange(customer.id);
                    setOpen(false);
                  }}
                  data-testid={`customer-option-${customer.id}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.name}</span>
                        {customer.tags.includes("VIP") && (
                          <Badge className="bg-amber-500 text-white text-xs">VIP</Badge>
                        )}
                        {customer.tags.includes("HIGH_RISK") && (
                          <Badge className="bg-red-500 text-white text-xs">
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.phone}
                      </div>
                    </div>
                    {value === customer.id && <Check className="h-4 w-4" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function HighRiskWarningDialog({
  customer,
  open,
  onConfirm,
  onCancel,
}: {
  customer: Customer | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            High Risk Customer
          </DialogTitle>
          <DialogDescription>
            This customer has been flagged as high risk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
            <div className="mt-2 text-sm">
              <p>No-shows: {customer.noShowCount}</p>
              {customer.notes && (
                <p className="mt-1 text-muted-foreground">
                  Notes: {customer.notes}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to proceed with this booking?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} data-testid="button-confirm-high-risk">
              Proceed Anyway
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookingConfirmationDialog({
  booking,
  court,
  customer,
  open,
  onClose,
}: {
  booking: Booking | null;
  court: Court | null;
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!booking || !court || !customer) return null;

  const qrValue = `BOOKING:${booking.id}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Booking Confirmed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center p-4 bg-white rounded-md">
            <QRCodeSVG value={qrValue} size={150} />
            <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
          </div>

          <div className="text-left p-4 bg-muted rounded-md">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Customer:</div>
              <div className="font-medium">{customer.name}</div>
              <div className="text-muted-foreground">Court:</div>
              <div className="font-medium">{court.name}</div>
              <div className="text-muted-foreground">Date:</div>
              <div className="font-medium">{booking.date}</div>
              <div className="text-muted-foreground">Time:</div>
              <div className="font-medium">
                {booking.startTime} - {booking.endTime}
              </div>
              <div className="text-muted-foreground">Amount:</div>
              <div className="font-medium">₹{booking.totalAmount}</div>
              <div className="text-muted-foreground">Paid:</div>
              <div className="font-medium">₹{booking.paidAmount}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" data-testid="button-send-whatsapp">
              Send via WhatsApp
            </Button>
            <Button className="flex-1" onClick={onClose} data-testid="button-done">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WalkinBooking() {
  const { toast } = useToast();
  const [highRiskWarning, setHighRiskWarning] = useState<Customer | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const { data: courts, isLoading: courtsLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      courtId: "",
      customerId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      duration: 60,
      paymentMethod: "cash",
      paidAmount: 0,
      notes: "",
    },
  });

  const selectedCourt = courts?.find((c) => c.id === form.watch("courtId"));
  const selectedCustomer = customers?.find((c) => c.id === form.watch("customerId"));
  const duration = form.watch("duration");
  const startTime = form.watch("startTime");

  const calculateEndTime = (start: string, dur: number) => {
    if (!start) return "";
    const [hours, minutes] = start.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + dur;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
  };

  const endTime = calculateEndTime(startTime, duration);

  const calculatePrice = () => {
    if (!selectedCourt || !duration) return 0;
    const hourlyRate = Number(selectedCourt.hourlyRate);
    return Math.round((hourlyRate * duration) / 60);
  };

  const totalPrice = calculatePrice();

  const createBooking = useMutation<Booking, Error, BookingFormValues>({
    mutationFn: async (data) => {
      const bookingData = {
        ...data,
        endTime: calculateEndTime(data.startTime, data.duration),
        totalAmount: totalPrice.toString(),
        paidAmount: (data.paidAmount || 0).toString(),
        paymentStatus:
          (data.paidAmount || 0) >= totalPrice
            ? "paid"
            : (data.paidAmount || 0) > 0
            ? "partial"
            : "pending",
        status: "confirmed",
        qrCode: `BOOKING:${Date.now()}`,
      };
      return apiRequestJson("POST", "/api/bookings", bookingData);
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({ title: "Booking created successfully" });
      setConfirmedBooking(booking);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    const customer = customers?.find((c) => c.id === data.customerId);
    if (customer?.tags.includes("HIGH_RISK")) {
      setHighRiskWarning(customer);
      return;
    }
    createBooking.mutate(data);
  };

  const confirmHighRiskBooking = () => {
    setHighRiskWarning(null);
    createBooking.mutate(form.getValues());
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Walk-in Booking</h1>
        <p className="text-muted-foreground text-sm">
          Quick booking for customers at the desk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courtsLoading || customersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer
                        </FormLabel>
                        <FormControl>
                          <CustomerSearchCombobox
                            customers={customers || []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courtId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Court</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-court">
                              <SelectValue placeholder="Select a court" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courts?.filter((c) => c.isActive).map((court) => (
                              <SelectItem key={court.id} value={court.id}>
                                {court.name} - {court.sport} (₹{court.hourlyRate}/hr)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-start-time">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_SLOTS.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-duration">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DURATIONS.map((dur) => (
                                <SelectItem key={dur.value} value={dur.value.toString()}>
                                  {dur.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Paid (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              data-testid="input-paid-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Any special requests..."
                            {...field}
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={createBooking.isPending}
                    data-testid="button-create-booking"
                  >
                    {createBooking.isPending ? "Creating..." : "Create Booking"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCustomer && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Customer</div>
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomer.phone}
                  </div>
                  {selectedCustomer.tags.includes("VIP") && (
                    <Badge className="mt-2 bg-amber-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      VIP Customer
                    </Badge>
                  )}
                </div>
              )}

              {selectedCourt && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Court</div>
                  <div className="font-medium">{selectedCourt.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCourt.sport}
                  </div>
                </div>
              )}

              {startTime && endTime && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Time Slot</div>
                  <div className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {startTime} - {endTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {duration} minutes
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-primary">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>Balance Due</span>
                  <span>
                    ₹{Math.max(0, totalPrice - (form.watch("paidAmount") || 0))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <HighRiskWarningDialog
        customer={highRiskWarning}
        open={!!highRiskWarning}
        onConfirm={confirmHighRiskBooking}
        onCancel={() => setHighRiskWarning(null)}
      />

      <BookingConfirmationDialog
        booking={confirmedBooking}
        court={selectedCourt || null}
        customer={selectedCustomer || null}
        open={!!confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
      />
    </div>
  );
}
