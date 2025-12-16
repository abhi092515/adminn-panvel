import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Plus,
  Bell,
  Check,
  X,
  User,
  Calendar,
  Send,
  MessageCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { Waitlist, Customer, Court } from "@shared/schema";
import { insertWaitlistSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TIME_SLOTS } from "@/lib/constants";

const waitlistFormSchema = insertWaitlistSchema.extend({
  courtId: z.string().min(1, "Please select a court"),
  customerId: z.string().min(1, "Please select a customer"),
  date: z.string().min(1, "Please select a date"),
  preferredStartTime: z.string().min(1, "Please select a start time"),
  preferredEndTime: z.string().min(1, "Please select an end time"),
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

function WaitlistStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    waiting: {
      className: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
      label: "Waiting",
    },
    notified: {
      className: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30",
      label: "Notified",
    },
    booked: {
      className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
      label: "Booked",
    },
    expired: {
      className: "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30",
      label: "Expired",
    },
  };

  const variant = variants[status] || variants.waiting;

  return (
    <Badge variant="outline" className={`${variant.className} text-xs`}>
      {variant.label}
    </Badge>
  );
}

function AddToWaitlistDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const { data: courts } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      courtId: "",
      customerId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      preferredStartTime: "",
      preferredEndTime: "",
      status: "waiting",
    },
  });

  const createWaitlist = useMutation({
    mutationFn: async (data: WaitlistFormValues) => {
      const response = await apiRequest("POST", "/api/waitlist", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({ title: "Added to waitlist successfully" });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to waitlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WaitlistFormValues) => {
    createWaitlist.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Waitlist</DialogTitle>
          <DialogDescription>
            Add a customer to the waitlist for a specific slot
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-waitlist-customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
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
              name="courtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-waitlist-court">
                        <SelectValue placeholder="Select court" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courts?.filter((c) => c.isActive).map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name} - {court.sport}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-waitlist-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Start</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-waitlist-start">
                          <SelectValue placeholder="Start time" />
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
                name="preferredEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred End</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-waitlist-end">
                          <SelectValue placeholder="End time" />
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
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWaitlist.isPending} data-testid="button-add-waitlist">
                {createWaitlist.isPending ? "Adding..." : "Add to Waitlist"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function WaitlistPage() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: waitlistItems, isLoading } = useQuery<Waitlist[]>({
    queryKey: ["/api/waitlist"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: courts } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const getCustomer = (id: string) => customers?.find((c) => c.id === id);
  const getCourt = (id: string) => courts?.find((c) => c.id === id);

  const notifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/waitlist/${id}`, { status: "notified" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({ title: "Customer notified via WhatsApp" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to notify customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeWaitlist = waitlistItems?.filter(
    (w) => w.status === "waiting" || w.status === "notified"
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Waitlist</h1>
          <p className="text-muted-foreground text-sm">
            Manage customers waiting for slot openings
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-to-waitlist">
          <Plus className="h-4 w-4 mr-2" />
          Add to Waitlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Waitlist
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-active-waitlist">
              {activeWaitlist.length}
            </div>
            <p className="text-xs text-muted-foreground">customers waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notified Today
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-notified-today">
              {waitlistItems?.filter((w) => w.status === "notified").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-converted">
              {waitlistItems?.filter((w) => w.status === "booked").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">successfully booked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Preferred Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWaitlist.map((item) => {
                    const customer = getCustomer(item.customerId);
                    const court = getCourt(item.courtId);

                    return (
                      <TableRow key={item.id} data-testid={`waitlist-row-${item.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                              {customer?.name.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="font-medium">{customer?.name || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer?.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{court?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {court?.sport}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          {item.preferredStartTime} - {item.preferredEndTime}
                        </TableCell>
                        <TableCell>
                          <WaitlistStatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status === "waiting" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => notifyMutation.mutate(item.id)}
                                disabled={notifyMutation.isPending}
                                data-testid={`button-notify-${item.id}`}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Notify
                              </Button>
                            )}
                            {item.status === "notified" && (
                              <Button size="sm" data-testid={`button-book-${item.id}`}>
                                <Check className="h-4 w-4 mr-1" />
                                Book Now
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {activeWaitlist.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers in waitlist</p>
                  <p className="text-sm mt-1">
                    Add customers when prime slots are fully booked
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddToWaitlistDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  );
}
