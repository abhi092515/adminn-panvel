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
  Minus,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { Tournament, TournamentTeam, TournamentMatch } from "@shared/schema";
import { insertTournamentSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type MatchWithTeams = TournamentMatch & {
  team1?: TournamentTeam;
  team2?: TournamentTeam;
  winner?: TournamentTeam;
};

function TournamentCard({ tournament, onOpenScoreboard }: { tournament: Tournament; onOpenScoreboard: (t: Tournament) => void }) {
  const { data: teams } = useQuery<TournamentTeam[]>({
    queryKey: ["/api/tournaments", tournament.id, "teams"],
  });

  const registeredTeams = teams?.length || 0;
  const spotsLeft = tournament.maxTeams - registeredTeams;

  const handleClick = () => {
    if (onOpenScoreboard) {
      onOpenScoreboard(tournament);
    }
  };

  return (
    <Card className="hover-elevate cursor-pointer" data-testid={`tournament-card-${tournament.id}`} onClick={handleClick}>
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
          <div className="flex items-center justify-between gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm">
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
            </span>
            <Button size="sm" data-testid="button-view-tournament" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
              View Details
            </Button>
          </div>
        )}

        {tournament.status === "ongoing" && (
          <Button className="w-full" variant="outline" data-testid="button-update-scores" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            <Target className="h-4 w-4 mr-2" />
            Update Scores
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MatchCard({ match, onUpdateScore }: { match: MatchWithTeams; onUpdateScore: (matchId: string, team1Score: number, team2Score: number) => void }) {
  const statusColors: Record<string, string> = {
    scheduled: "bg-gray-100 dark:bg-gray-800",
    live: "bg-green-50 dark:bg-green-950 border-green-500",
    completed: "bg-muted",
  };

  return (
    <Card className={`${statusColors[match.status] || ""} ${match.status === "live" ? "border-2" : ""}`} data-testid={`match-card-${match.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-between flex-1 gap-2">
            <div className="flex-1 text-center">
              <p className={`font-medium ${match.winnerId === match.team1Id ? "text-green-600 dark:text-green-400" : ""}`}>
                {match.team1?.name || "Team 1"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg">
              {match.status === "completed" || match.status === "live" ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={match.status === "completed"}
                    onClick={() => onUpdateScore(match.id, Math.max(0, (match.team1Score || 0) - 1), match.team2Score || 0)}
                    data-testid="button-team1-minus"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-bold min-w-12 text-center" data-testid="text-team1-score">
                    {match.team1Score || 0}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={match.status === "completed"}
                    onClick={() => onUpdateScore(match.id, (match.team1Score || 0) + 1, match.team2Score || 0)}
                    data-testid="button-team1-plus"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">VS</span>
              )}
              <span className="text-muted-foreground">-</span>
              {match.status === "completed" || match.status === "live" ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={match.status === "completed"}
                    onClick={() => onUpdateScore(match.id, match.team1Score || 0, Math.max(0, (match.team2Score || 0) - 1))}
                    data-testid="button-team2-minus"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-bold min-w-12 text-center" data-testid="text-team2-score">
                    {match.team2Score || 0}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={match.status === "completed"}
                    onClick={() => onUpdateScore(match.id, match.team1Score || 0, (match.team2Score || 0) + 1)}
                    data-testid="button-team2-plus"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
            <div className="flex-1 text-center">
              <p className={`font-medium ${match.winnerId === match.team2Id ? "text-green-600 dark:text-green-400" : ""}`}>
                {match.team2?.name || "Team 2"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {match.status === "live" && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                <Play className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            {match.status === "scheduled" && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
            {match.status === "completed" && (
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Final
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">Round {match.round}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TournamentScoreboard({
  tournament,
  open,
  onClose,
}: {
  tournament: Tournament | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [selectedTeam1, setSelectedTeam1] = useState("");
  const [selectedTeam2, setSelectedTeam2] = useState("");
  const [matchRound, setMatchRound] = useState(1);

  const { data: teams = [] } = useQuery<TournamentTeam[]>({
    queryKey: ["/api/tournaments", tournament?.id, "teams"],
    enabled: !!tournament?.id,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<MatchWithTeams[]>({
    queryKey: ["/api/tournaments", tournament?.id, "matches"],
    enabled: !!tournament?.id,
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: { team1Id: string; team2Id: string; round: number; matchNumber: number }) => {
      return apiRequest("POST", `/api/tournaments/${tournament?.id}/matches`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "matches"] });
      setAddMatchOpen(false);
      setSelectedTeam1("");
      setSelectedTeam2("");
      toast({ title: "Match created" });
    },
    onError: () => {
      toast({ title: "Failed to create match", variant: "destructive" });
    },
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ matchId, team1Score, team2Score }: { matchId: string; team1Score: number; team2Score: number }) => {
      return apiRequest("POST", `/api/tournaments/${tournament?.id}/matches/${matchId}/score`, {
        team1Score,
        team2Score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "matches"] });
    },
    onError: () => {
      toast({ title: "Failed to update score", variant: "destructive" });
    },
  });

  const completeMatchMutation = useMutation({
    mutationFn: async ({ matchId, winnerId }: { matchId: string; winnerId: string }) => {
      return apiRequest("PATCH", `/api/tournaments/${tournament?.id}/matches/${matchId}`, {
        status: "completed",
        winnerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "matches"] });
      toast({ title: "Match completed" });
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("PATCH", `/api/tournaments/${tournament?.id}/matches/${matchId}`, {
        status: "live",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament?.id, "matches"] });
      toast({ title: "Match started" });
    },
  });

  const handleUpdateScore = (matchId: string, team1Score: number, team2Score: number) => {
    updateScoreMutation.mutate({ matchId, team1Score, team2Score });
  };

  const handleCreateMatch = () => {
    if (!selectedTeam1 || !selectedTeam2) {
      toast({ title: "Please select both teams", variant: "destructive" });
      return;
    }
    const matchNumber = matches.filter(m => m.round === matchRound).length + 1;
    createMatchMutation.mutate({
      team1Id: selectedTeam1,
      team2Id: selectedTeam2,
      round: matchRound,
      matchNumber,
    });
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const liveMatches = matches.filter(m => m.status === "live");
  const scheduledMatches = matches.filter(m => m.status === "scheduled");
  const completedMatches = matches.filter(m => m.status === "completed");

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {tournament.name} - Scoreboard
          </DialogTitle>
          <DialogDescription>
            {tournament.sport} | {tournament.startDate} to {tournament.endDate}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches" data-testid="tab-matches">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">
              <Play className="h-4 w-4 mr-2" />
              Live ({liveMatches.length})
            </TabsTrigger>
            <TabsTrigger value="teams" data-testid="tab-teams">
              <Users className="h-4 w-4 mr-2" />
              Teams ({teams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold">All Matches</h3>
              <Button size="sm" onClick={() => setAddMatchOpen(true)} data-testid="button-add-match">
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </div>

            {matchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No matches scheduled yet</p>
                  <Button className="mt-4" onClick={() => setAddMatchOpen(true)}>
                    Create First Match
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {rounds.map((round) => (
                  <div key={round}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Round {round}
                    </h4>
                    <div className="space-y-2">
                      {matchesByRound[round].map((match) => (
                        <div key={match.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <MatchCard match={match} onUpdateScore={handleUpdateScore} />
                          </div>
                          <div className="flex flex-col gap-1">
                            {match.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startMatchMutation.mutate(match.id)}
                                data-testid={`button-start-match-${match.id}`}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {match.status === "live" && match.team1Id && match.team2Id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => completeMatchMutation.mutate({ matchId: match.id, winnerId: match.team1Id! })}
                                  data-testid={`button-team1-wins-${match.id}`}
                                >
                                  {(match.team1?.name?.slice(0, 6) || "Team 1")} Wins
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => completeMatchMutation.mutate({ matchId: match.id, winnerId: match.team2Id! })}
                                  data-testid={`button-team2-wins-${match.id}`}
                                >
                                  {(match.team2?.name?.slice(0, 6) || "Team 2")} Wins
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Match Dialog */}
            <Dialog open={addMatchOpen} onOpenChange={setAddMatchOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Match</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Round</label>
                    <Select value={String(matchRound)} onValueChange={(v) => setMatchRound(Number(v))}>
                      <SelectTrigger data-testid="select-round">
                        <SelectValue placeholder="Select round" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            Round {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Team 1</label>
                    <Select value={selectedTeam1} onValueChange={setSelectedTeam1}>
                      <SelectTrigger data-testid="select-team1">
                        <SelectValue placeholder="Select team 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.id !== selectedTeam2).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Team 2</label>
                    <Select value={selectedTeam2} onValueChange={setSelectedTeam2}>
                      <SelectTrigger data-testid="select-team2">
                        <SelectValue placeholder="Select team 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.id !== selectedTeam1).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateMatch}
                    disabled={createMatchMutation.isPending}
                    data-testid="button-submit-match"
                  >
                    {createMatchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Match
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="live" className="space-y-4 mt-4">
            <h3 className="font-semibold">Live Matches</h3>
            {liveMatches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No live matches at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} onUpdateScore={handleUpdateScore} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4 mt-4">
            <h3 className="font-semibold">Registered Teams</h3>
            {teams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No teams registered yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <Card key={team.id} data-testid={`team-card-${team.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {Array.isArray(team.players) ? (team.players as string[]).length : 0} players
                          </p>
                        </div>
                        <Badge variant={team.isPaid ? "default" : "secondary"}>
                          {team.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const upcomingTournaments = tournaments?.filter((t) => t.status === "upcoming") || [];
  const ongoingTournaments = tournaments?.filter((t) => t.status === "ongoing") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const handleOpenScoreboard = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setScoreboardOpen(true);
  };

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
                  <TournamentCard key={tournament.id} tournament={tournament} onOpenScoreboard={handleOpenScoreboard} />
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
                  <TournamentCard key={tournament.id} tournament={tournament} onOpenScoreboard={handleOpenScoreboard} />
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
                  <TournamentCard key={tournament.id} tournament={tournament} onOpenScoreboard={handleOpenScoreboard} />
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

      <TournamentScoreboard
        tournament={selectedTournament}
        open={scoreboardOpen}
        onClose={() => setScoreboardOpen(false)}
      />
    </div>
  );
}
