import { storage } from "../storage";
import type { BroadcastFn } from "../realtime/websocket";
import {
  insertTournamentSchema,
  insertTournamentTeamSchema,
  insertTournamentMatchSchema,
} from "@shared/schema";
import { asyncHandler } from "../utils/asyncHandler";

export const listTournaments = asyncHandler(async (_req, res) => {
  const tournaments = await storage.getTournaments();
  res.json(tournaments);
});

export const getTournament = asyncHandler(async (req, res) => {
  const tournament = await storage.getTournament(req.params.id);
  if (!tournament) {
    return res.status(404).json({ message: "Tournament not found" });
  }
  res.json(tournament);
});

export const createTournament = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertTournamentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const tournament = await storage.createTournament(result.data);
    broadcast("tournament_created", tournament);
    res.status(201).json(tournament);
  });

export const updateTournament = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const tournament = await storage.updateTournament(req.params.id, req.body);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    broadcast("tournament_updated", tournament);
    res.json(tournament);
  });

export const listTournamentTeams = asyncHandler(async (req, res) => {
  const teams = await storage.getTournamentTeams(req.params.id);
  res.json(teams);
});

export const createTournamentTeam = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertTournamentTeamSchema.safeParse({
      ...req.body,
      tournamentId: req.params.id,
    });
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const team = await storage.createTournamentTeam(result.data);
    broadcast("tournament_team_created", team);
    res.status(201).json(team);
  });

export const listTournamentMatches = asyncHandler(async (req, res) => {
  const matches = await storage.getTournamentMatches(req.params.id);
  const teams = await storage.getTournamentTeams(req.params.id);
  const enriched = matches.map((match) => ({
    ...match,
    team1: teams.find((t) => t.id === match.team1Id),
    team2: teams.find((t) => t.id === match.team2Id),
    winner: teams.find((t) => t.id === match.winnerId),
  }));
  res.json(enriched);
});

export const createTournamentMatch = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const result = insertTournamentMatchSchema.safeParse({
      ...req.body,
      tournamentId: req.params.id,
    });
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const match = await storage.createTournamentMatch(result.data);
    const teams = await storage.getTournamentTeams(req.params.id);
    const enrichedMatch = {
      ...match,
      team1: teams.find((t) => t.id === match.team1Id),
      team2: teams.find((t) => t.id === match.team2Id),
    };
    broadcast("match_created", enrichedMatch);
    res.status(201).json(enrichedMatch);
  });

export const updateTournamentMatch = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const match = await storage.updateTournamentMatch(req.params.matchId, req.body);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    const teams = await storage.getTournamentTeams(req.params.tournamentId);
    const enrichedMatch = {
      ...match,
      team1: teams.find((t) => t.id === match.team1Id),
      team2: teams.find((t) => t.id === match.team2Id),
      winner: teams.find((t) => t.id === match.winnerId),
    };
    broadcast("match_updated", enrichedMatch);
    res.json(enrichedMatch);
  });

export const updateTournamentScore = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    const { team1Score, team2Score } = req.body;
    const match = await storage.updateTournamentMatch(req.params.matchId, {
      team1Score,
      team2Score,
      status: "live",
    });
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    const teams = await storage.getTournamentTeams(req.params.tournamentId);
    const enrichedMatch = {
      ...match,
      team1: teams.find((t) => t.id === match.team1Id),
      team2: teams.find((t) => t.id === match.team2Id),
    };
    broadcast("score_updated", enrichedMatch);
    res.json(enrichedMatch);
  });

export const deleteTournamentMatch = (broadcast: BroadcastFn) =>
  asyncHandler(async (req, res) => {
    await storage.deleteTournamentMatch(req.params.matchId);
    broadcast("match_deleted", { id: req.params.matchId, tournamentId: req.params.tournamentId });
    res.status(204).send();
  });
