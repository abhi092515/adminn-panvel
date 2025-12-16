import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  FormDescription,
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
  Building,
  Plus,
  Edit,
  Trash2,
  LayoutGrid,
  Bell,
  MessageCircle,
  Shield,
  CreditCard,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Court } from "@shared/schema";
import { insertCourtSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SPORTS } from "@/lib/constants";

const courtFormSchema = insertCourtSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sport: z.string().min(1, "Please select a sport"),
  hourlyRate: z.coerce.number().positive("Rate must be positive"),
  peakHourlyRate: z.coerce.number().optional(),
});

type CourtFormValues = z.infer<typeof courtFormSchema>;

function CourtDialog({
  court,
  open,
  onClose,
}: {
  court?: Court | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!court;

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtFormSchema),
    defaultValues: court
      ? {
          name: court.name,
          sport: court.sport,
          description: court.description || "",
          hourlyRate: Number(court.hourlyRate),
          peakHourlyRate: court.peakHourlyRate ? Number(court.peakHourlyRate) : undefined,
          isActive: court.isActive,
        }
      : {
          name: "",
          sport: "",
          description: "",
          hourlyRate: 500,
          peakHourlyRate: undefined,
          isActive: true,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: CourtFormValues) => {
      const payload = {
        ...data,
        hourlyRate: data.hourlyRate.toString(),
        peakHourlyRate: data.peakHourlyRate?.toString() || null,
      };

      if (isEditing) {
        return apiRequest("PATCH", `/api/courts/${court.id}`, payload);
      }
      return apiRequest("POST", "/api/courts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      toast({ title: isEditing ? "Court updated" : "Court added" });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: isEditing ? "Failed to update court" : "Failed to add court",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourtFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Court" : "Add New Court"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update court details" : "Add a new court or playing area"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Court 1, Main Turf" {...field} data-testid="input-court-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-court-sport">
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPORTS.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value}>
                          {sport.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-hourly-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peakHourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peak Rate (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-peak-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Court details..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-court-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription className="text-xs">
                      Available for bookings
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-court-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-court">
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Add Court"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [courtDialogOpen, setCourtDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const { data: courts, isLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/courts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      toast({ title: "Court deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete court",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your venue configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Courts & Playing Areas
                </CardTitle>
                <CardDescription>
                  Manage your bookable courts and turfs
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingCourt(null);
                  setCourtDialogOpen(true);
                }}
                data-testid="button-add-court"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Court
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courts?.map((court) => (
                      <TableRow key={court.id} data-testid={`court-row-${court.id}`}>
                        <TableCell className="font-medium">{court.name}</TableCell>
                        <TableCell className="capitalize">{court.sport}</TableCell>
                        <TableCell className="text-right">
                          ₹{court.hourlyRate}/hr
                          {court.peakHourlyRate && (
                            <span className="text-muted-foreground text-xs block">
                              Peak: ₹{court.peakHourlyRate}/hr
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={court.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {court.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCourt(court);
                                setCourtDialogOpen(true);
                              }}
                              data-testid={`button-edit-court-${court.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(court.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-court-${court.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {(!courts || courts.length === 0) && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courts configured</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => {
                      setEditingCourt(null);
                      setCourtDialogOpen(true);
                    }}
                    data-testid="link-add-first-court"
                  >
                    Add your first court
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Venue Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Venue Name</label>
                <Input
                  defaultValue="My Sports Venue"
                  className="mt-1"
                  data-testid="input-venue-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  defaultValue="+91 98765 43210"
                  className="mt-1"
                  data-testid="input-venue-phone"
                />
              </div>
              <Button className="w-full" data-testid="button-save-venue">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking Confirmations</p>
                  <p className="text-xs text-muted-foreground">
                    Send booking details via WhatsApp
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-whatsapp-bookings" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Payment Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Send payment links for pending dues
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-whatsapp-payments" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Slot Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Remind customers 1 hour before
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-whatsapp-reminders" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Commission Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform Commission</span>
                  <Badge variant="secondary">5%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied on cash payments only
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Online payments are processed directly with no additional commission.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <CourtDialog
        court={editingCourt}
        open={courtDialogOpen}
        onClose={() => {
          setCourtDialogOpen(false);
          setEditingCourt(null);
        }}
      />
    </div>
  );
}
