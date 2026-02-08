import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Search,
  Plus,
  MoreHorizontal,
  Star,
  AlertTriangle,
  Phone,
  Mail,
  User,
  History,
  Ban,
  Tag,
  Wallet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Customer, Booking } from "@shared/schema";
import { insertCustomerSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CUSTOMER_TAGS } from "@/lib/constants";

const customerFormSchema = insertCustomerSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

function CustomerTagBadge({ tag }: { tag: string }) {
  const tagConfig = CUSTOMER_TAGS.find((t) => t.value === tag);
  if (!tagConfig) return null;

  return (
    <Badge className={`${tagConfig.color} text-xs`}>
      {tag === "VIP" && <Star className="h-3 w-3 mr-1" />}
      {tag === "HIGH_RISK" && <AlertTriangle className="h-3 w-3 mr-1" />}
      {tagConfig.label}
    </Badge>
  );
}

function CustomerDetailDialog({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!customer,
  });

  if (!customer) return null;

  const customerBookings = bookings?.filter((b) => b.customerId === customer.id) || [];
  const reliabilityScore = customer.totalBookings > 0
    ? Math.round(((customer.totalBookings - customer.noShowCount) / customer.totalBookings) * 100)
    : 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
          <DialogDescription>View customer details and booking history</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{customer.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.tags.map((tag) => (
                    <CustomerTagBadge key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Spend</div>
                <div className="text-lg font-semibold">
                  ₹{Number(customer.totalSpend).toLocaleString()}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Bookings</div>
                <div className="text-lg font-semibold">{customer.totalBookings}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground mb-1">No-Shows</div>
                <div className="text-lg font-semibold text-orange-500">
                  {customer.noShowCount}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Reliability</div>
                <div
                  className={`text-lg font-semibold ${
                    reliabilityScore >= 80
                      ? "text-green-500"
                      : reliabilityScore >= 60
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {reliabilityScore}%
                </div>
              </Card>
            </div>

            {customer.notes && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Bookings
            </h4>
            <div className="space-y-2 max-h-64 overflow-auto">
              {customerBookings.length > 0 ? (
                customerBookings.slice(0, 10).map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 bg-muted rounded-md text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{booking.date}</span>
                      <Badge variant="outline" className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {booking.startTime} - {booking.endTime} | ₹{booking.totalAmount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No booking history</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCustomerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
      source: "walkin",
      tags: [],
      isBlacklisted: false,
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer added successfully" });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    createCustomer.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Register a new customer in the system</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} data-testid="input-customer-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} data-testid="input-customer-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-customer-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any notes about this customer"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-customer-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomer.isPending} data-testid="button-save-customer">
                {createCustomer.isPending ? "Saving..." : "Add Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground text-sm">
            Manage your customer database and profiles
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-customer">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">Customer Database</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-customers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Reliability</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers?.map((customer) => {
                    const reliabilityScore =
                      customer.totalBookings > 0
                        ? Math.round(
                            ((customer.totalBookings - customer.noShowCount) /
                              customer.totalBookings) *
                              100
                          )
                        : 100;

                    return (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                        data-testid={`row-customer-${customer.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {customer.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer.source}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-xs text-muted-foreground">
                              {customer.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.map((tag) => (
                              <CustomerTagBadge key={tag} tag={tag} />
                            ))}
                            {customer.isBlacklisted && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                Blacklisted
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(customer.totalSpend).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.totalBookings}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              reliabilityScore >= 80
                                ? "text-green-500 border-green-500/30"
                                : reliabilityScore >= 60
                                ? "text-orange-500 border-orange-500/30"
                                : "text-red-500 border-red-500/30"
                            }
                          >
                            {reliabilityScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" data-testid={`button-customer-actions-${customer.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="h-4 w-4 mr-2" />
                                Manage Tags
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Wallet className="h-4 w-4 mr-2" />
                                View Transactions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="h-4 w-4 mr-2" />
                                Blacklist Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {(!filteredCustomers || filteredCustomers.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers found</p>
                  <Button
                    variant="ghost"
                    className="mt-2 underline text-primary"
                    onClick={() => setAddDialogOpen(true)}
                    data-testid="link-add-first-customer"
                  >
                    Add your first customer
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      <AddCustomerDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  );
}
