import { Router } from "express";
import {
  listTournaments,
  getTournament,
  createTournament,
  updateTournament,
  listTournamentTeams,
  createTournamentTeam,
  listTournamentMatches,
  createTournamentMatch,
  updateTournamentMatch,
  updateTournamentScore,
  deleteTournamentMatch,
} from "../controllers/tournamentsController";
import type { BroadcastFn } from "../realtime/websocket";

export function createTournamentsRouter(broadcast: BroadcastFn) {
  const router = Router();
  router.get("/", listTournaments);
  router.get("/:id", getTournament);
  router.post("/", createTournament(broadcast));
  router.patch("/:id", updateTournament(broadcast));

  router.get("/:id/teams", listTournamentTeams);
  router.post("/:id/teams", createTournamentTeam(broadcast));

  router.get("/:id/matches", listTournamentMatches);
  router.post("/:id/matches", createTournamentMatch(broadcast));
  router.patch("/:tournamentId/matches/:matchId", updateTournamentMatch(broadcast));
  router.post("/:tournamentId/matches/:matchId/score", updateTournamentScore(broadcast));
  router.delete("/:tournamentId/matches/:matchId", deleteTournamentMatch(broadcast));

  return router;
}
