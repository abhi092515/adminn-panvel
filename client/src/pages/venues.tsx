import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequestJson, queryClient } from "@/lib/queryClient";
import type { Venue } from "@shared/schema";
import { Loader2, Plus, MapPin, Star, Trash2, Edit3, Share2 } from "lucide-react";

const venueFormSchema = z.object({
  title: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
  isFav: z.boolean().default(false),
  shareableLink: z.string().url().optional().or(z.literal("")),
  mainCategoryId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  images: z.string().optional().default(""), // comma separated
  contactDetails: z.string().optional(),
  bio: z.string().optional(),
  operationalHours: z.string().optional(),
  amenities: z.string().optional().default(""), // comma separated
  direction: z.string().optional(),
  price: z.string().min(1, "Required"),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

export default function VenuesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);

  const { data: venues, isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      title: "",
      location: "",
      isFav: false,
      images: "",
      amenities: "",
      price: "",
    },
  });

  const resetAndClose = () => {
    form.reset();
    setEditing(null);
    setDialogOpen(false);
  };

  const createMutation = useMutation({
    mutationFn: async (values: VenueFormValues) => {
      const payload = toPayload(values);
      return apiRequestJson("POST", "/api/venues", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Venue created" });
      resetAndClose();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create venue", description: error?.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: VenueFormValues }) => {
      const payload = toPayload(values);
      return apiRequestJson("PATCH", `/api/venues/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Venue updated" });
      resetAndClose();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update venue", description: error?.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequestJson("DELETE", `/api/venues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Venue deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete venue", description: error?.message, variant: "destructive" });
    },
  });

  const startEdit = (venue: Venue) => {
    setEditing(venue);
    form.reset({
      title: venue.title,
      location: venue.location,
      isFav: venue.isFav,
      shareableLink: venue.shareableLink || "",
      mainCategoryId: venue.mainCategoryId || "",
      categoryId: venue.categoryId || "",
      images: (venue.images || []).join(", "),
      contactDetails: venue.aboutVenue?.contactDetails || "",
      bio: venue.aboutVenue?.bio || "",
      operationalHours: venue.aboutVenue?.operationalHours || "",
      amenities: (venue.amenities || []).join(", "),
      direction: venue.direction || "",
      price: venue.price,
    });
    setDialogOpen(true);
  };

  const toPayload = (values: VenueFormValues) => {
    const images = values.images
      ? values.images.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      : [];
    const amenities = values.amenities
      ? values.amenities.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      title: values.title,
      location: values.location,
      isFav: values.isFav,
      shareableLink: values.shareableLink || undefined,
      mainCategoryId: values.mainCategoryId || undefined,
      categoryId: values.categoryId || undefined,
      images,
      aboutVenue: {
        contactDetails: values.contactDetails || undefined,
        bio: values.bio || undefined,
        operationalHours: values.operationalHours || undefined,
      },
      amenities,
      direction: values.direction || undefined,
      price: values.price,
      reviews: [],
    };
  };

  const onSubmit = (values: VenueFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const list = useMemo(() => venues || [], [venues]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Venues</h1>
          <p className="text-muted-foreground">Manage venue inventory, pricing, and visibility.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-venue">
          <Plus className="h-4 w-4 mr-2" /> Add Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue List</CardTitle>
          <CardDescription>All venues with quick actions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading venues…</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-60" />
              <p>No venues yet</p>
              <Button variant="ghost" className="mt-2 underline text-primary" onClick={() => setDialogOpen(true)}>
                Add your first venue
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Amenities</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">{venue.title}</TableCell>
                    <TableCell className="text-muted-foreground">{venue.location}</TableCell>
                    <TableCell>₹{venue.price}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(venue.amenities || []).slice(0, 4).map((a) => (
                          <Badge key={a} variant="outline" className="text-[11px]">{a}</Badge>
                        ))}
                        {venue.amenities && venue.amenities.length > 4 && (
                          <Badge variant="secondary">+{venue.amenities.length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {venue.isFav && <Badge variant="secondary">Fav</Badge>}
                      {venue.shareableLink && <Badge variant="outline"><Share2 className="h-3 w-3 mr-1" />Shareable</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(venue)} data-testid={`button-edit-venue-${venue.id}`}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(venue.id)} data-testid={`button-delete-venue-${venue.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetAndClose(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Venue" : "Add Venue"}</DialogTitle>
            <DialogDescription>Fill in venue details; commas split multiple images or amenities.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Arena One" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="1200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFav"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Favourite</FormLabel>
                      <p className="text-xs text-muted-foreground">Showcase this venue in highlights.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shareableLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shareable Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category Id</FormLabel>
                    <FormControl>
                      <Input placeholder="ObjectId" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Id</FormLabel>
                    <FormControl>
                      <Input placeholder="ObjectId" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Images (comma separated URLs)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="https://image1, https://image2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="col-span-2" />

              <FormField
                control={form.control}
                name="contactDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Details</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Phone, email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Short description" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operationalHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operational Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="06:00 - 23:00" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Amenities (comma separated)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Parking, WiFi, Showers" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Direction</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Directions or map link" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editing ? "Update" : "Create"} Venue
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
