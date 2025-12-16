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
  Trophy,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Play,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { Tournament, TournamentTeam } from "@shared/schema";
import { insertTournamentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SPORTS } from "@/lib/constants";

const tournamentFormSchema = insertTournamentSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sport: z.string().min(1, "Please select a sport"),
  maxTeams: z.coerce.number().min(2, "Minimum 2 teams required"),
  entryFee: z.coerce.number().min(0).optional(),
  prizePool: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

function TournamentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    upcoming: {
      icon: Clock,
      className: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
      label: "Upcoming",
    },
    ongoing: {
      icon: Play,
      className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
      label: "Ongoing",
    },
    completed: {
      icon: CheckCircle,
      className: "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30",
      label: "Completed",
    },
  };

  const variant = variants[status] || variants.upcoming;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={`${variant.className} text-xs`}>
      <Icon className="h-3 w-3 mr-1" />
      {variant.label}
    </Badge>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { data: teams } = useQuery<TournamentTeam[]>({
    queryKey: ["/api/tournaments", tournament.id, "teams"],
  });

  const registeredTeams = teams?.length || 0;
  const spotsLeft = tournament.maxTeams - registeredTeams;

  return (
    <Card className="hover-elevate cursor-pointer" data-testid={`tournament-card-${tournament.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{tournament.name}</h3>
            <p className="text-sm text-muted-foreground">{tournament.sport}</p>
          </div>
          <TournamentStatusBadge status={tournament.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{tournament.startDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {registeredTeams}/{tournament.maxTeams} teams
            </span>
          </div>
          {tournament.entryFee && Number(tournament.entryFee) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>₹{tournament.entryFee} entry</span>
            </div>
          )}
          {tournament.prizePool && Number(tournament.prizePool) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>₹{tournament.prizePool} prize</span>
            </div>
          )}
        </div>

        {tournament.status === "upcoming" && spotsLeft > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm">
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
            </span>
            <Button size="sm" data-testid="button-view-tournament">
              View Details
            </Button>
          </div>
        )}

        {tournament.status === "ongoing" && (
          <Button className="w-full" variant="outline" data-testid="button-update-scores">
            <Target className="h-4 w-4 mr-2" />
            Update Scores
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CreateTournamentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      sport: "",
      maxTeams: 8,
      entryFee: 0,
      prizePool: 0,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      status: "upcoming",
    },
  });

  const createTournament = useMutation({
    mutationFn: async (data: TournamentFormValues) => {
      const response = await apiRequest("POST", "/api/tournaments", {
        ...data,
        entryFee: (data.entryFee || 0).toString(),
        prizePool: (data.prizePool || 0).toString(),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({ title: "Tournament created successfully" });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create tournament",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TournamentFormValues) => {
    createTournament.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>Set up a new tournament or league</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekend Football Cup" {...field} data-testid="input-tournament-name" />
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
                      <SelectTrigger data-testid="select-tournament-sport">
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-tournament-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-tournament-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxTeams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Teams</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-max-teams" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} data-testid="input-entry-fee" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prizePool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Pool (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} data-testid="input-prize-pool" />
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
                      placeholder="Tournament details..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-tournament-description"
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
              <Button type="submit" disabled={createTournament.isPending} data-testid="button-create-tournament">
                {createTournament.isPending ? "Creating..." : "Create Tournament"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Tournaments() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const upcomingTournaments = tournaments?.filter((t) => t.status === "upcoming") || [];
  const ongoingTournaments = tournaments?.filter((t) => t.status === "ongoing") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tournaments</h1>
          <p className="text-muted-foreground text-sm">
            Manage tournaments, leagues, and team registrations
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-tournament">
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          {ongoingTournaments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Ongoing Tournaments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoingTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {upcomingTournaments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Upcoming Tournaments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {completedTournaments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-500" />
                Completed Tournaments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {(!tournaments || tournaments.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Tournaments Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first tournament to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-tournament">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CreateTournamentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
