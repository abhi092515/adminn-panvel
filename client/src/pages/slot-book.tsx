import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequestJson, queryClient } from "@/lib/queryClient";
import type { Court, Customer } from "@shared/schema";
import { Loader2, Calendar as CalIcon, Clock3, ShieldCheck, Users } from "lucide-react";

interface SlotDto { startAtUtc: string; endAtUtc: string; state: string; }

export default function SlotBookPage() {
  const { toast } = useToast();
  const [venueId, setVenueId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [from, setFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [to, setTo] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration] = useState<number>(60);

  const { data: courts } = useQuery<Court[]>({ queryKey: ["/api/courts"] });
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  useEffect(() => {
    if (!venueId && courts?.length) setVenueId(courts[0].id);
    if (!customerId && customers?.length) setCustomerId(customers[0].id);
  }, [venueId, courts, customerId, customers]);

  const { data: slots, isFetching, refetch } = useQuery<SlotDto[]>({
    queryKey: ["/api/venues", venueId, "slots", from, to, duration],
    enabled: !!venueId,
    queryFn: () => apiRequestJson("GET", `/api/venues/${venueId}/slots?from=${from}&to=${to}&serviceDuration=${duration}`),
  });

  const holdAndBook = useMutation({
    mutationFn: async (slot: SlotDto) => {
      const hold: any = await apiRequestJson("POST", "/api/holds", {
        venueId,
        startAtUtc: slot.startAtUtc,
        endAtUtc: slot.endAtUtc,
        customerId,
        idempotencyKey: `${venueId}-${slot.startAtUtc}-${customerId}`,
      });
      const holdId = hold?.data?.id || hold?.data?._id || hold?.id || hold?._id;
      const booking = await apiRequestJson("POST", "/api/bookings", {
        holdId,
        paymentRef: "admin-panel",
        customerId,
      });
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues", venueId, "slots", from, to, duration] });
      toast({ title: "Booked", description: "Slot confirmed." });
    },
    onError: (err: any) => toast({ title: "Could not book", description: err?.message || "Conflict", variant: "destructive" }),
  });

  const list = useMemo(() => slots || [], [slots]);
  const venue = courts?.find((c) => c.id === venueId);
  const customer = customers?.find((c) => c.id === customerId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={venueId} onValueChange={setVenueId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Select venue" /></SelectTrigger>
          <SelectContent>
            {(courts || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Select customer" /></SelectTrigger>
          <SelectContent>
            {(customers || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input type="number" min={15} step={15} className="w-24" value={duration} onChange={(e) => setDuration(Number(e.target.value || 60))} />
        <Button variant="outline" onClick={() => refetch()} disabled={!venueId || isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slots</CardTitle>
          <CardDescription>
            {venue ? venue.name : "Select a venue"} · {customer ? `For ${customer.name}` : "Select customer"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {isFetching && <p className="text-muted-foreground">Loading...</p>}
          {!isFetching && list.length === 0 && <p className="text-muted-foreground">No slots.</p>}
          {list.map((slot) => (
            <div key={`${slot.startAtUtc}-${slot.endAtUtc}`} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalIcon className="h-4 w-4" />
                {format(new Date(slot.startAtUtc), "PPPP")}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock3 className="h-4 w-4" />
                {format(new Date(slot.startAtUtc), "p")} - {format(new Date(slot.endAtUtc), "p")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {customer ? customer.name : "Select customer"}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase text-green-600">Available</span>
                <Button size="sm" onClick={() => holdAndBook.mutate(slot)} disabled={holdAndBook.isPending || !customerId}>
                  {holdAndBook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4 mr-1" />Book</>}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
