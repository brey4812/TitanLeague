"use client";

import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Team,
  MatchResult,
  Division,
  LeagueContextType,
  MatchEvent,
  Player,
} from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LeagueContext = createContext<LeagueContextType>(
  {} as LeagueContextType
);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);

  /* ===================== SESSION ID (NO TOCADO) ===================== */
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("league_session_id");
      if (!id) {
        id = Math.random().toString(36).substring(7);
        localStorage.setItem("league_session_id", id);
      }
      return id;
    }
    return "";
  });

  /* ===================== DIVISIONES ===================== */
  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" },
  ];

  /* ===================== CARGA INICIAL ===================== */
  const refreshData = useCallback(async () => {
    try {
      const savedTeams = localStorage.getItem("league_active_teams");
      if (savedTeams) setTeams(JSON.parse(savedTeams));

      const [matchesRes, eventsRes, seasonRes] = await Promise.all([
        supabase
          .from("matches")
          .select("*")
          .eq("session_id", sessionId)
          .order("round", { ascending: true }),
        supabase
          .from("match_events")
          .select("*")
          .eq("session_id", sessionId),
        supabase
          .from("seasons")
          .select("season_number")
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      if (seasonRes.data)
        setCurrentSeason(Number(seasonRes.data.season_number) || 1);

      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (e) {
      console.error("Error refreshData:", e);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /* ===================== PERSISTENCIA EQUIPOS ===================== */
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("league_active_teams", JSON.stringify(teams));
  }, [teams, isLoaded]);

  /* ===================== PROCESADO DE ESTADÍSTICAS ===================== */
  const processedTeams = useMemo<Team[]>(() => {
    if (!isLoaded) return [];

    return teams.map((team) => {
      const stats = {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };

      const teamMatches = matches.filter(
        (m) =>
          m.played &&
          Number(m.season) === currentSeason &&
          (String(m.home_team) === String(team.id) ||
            String(m.away_team) === String(team.id))
      );

      teamMatches.forEach((m) => {
        const isHome = String(m.home_team) === String(team.id);
        const gf = isHome ? m.home_goals : m.away_goals;
        const ga = isHome ? m.away_goals : m.home_goals;
        stats.goalsFor += gf;
        stats.goalsAgainst += ga;
        if (gf > ga) stats.wins++;
        else if (gf === ga) stats.draws++;
        else stats.losses++;
      });

      const points = stats.wins * 3 + stats.draws;

      const roster: Player[] = (team.roster || []).map((p) => {
        const events = matchEvents.filter(
          (e) =>
            String(e.player_id) === String(p.id) &&
            teamMatches.some((m) => String(m.id) === String(e.match_id))
        );

        const goals = events.filter((e) => e.type === "GOAL").length;
        const assists = events.filter((e) => e.type === "ASSIST").length;
        const yellow = events.filter((e) => e.type === "YELLOW_CARD").length;
        const red = events.filter((e) => e.type === "RED_CARD").length;

        const cleanSheets =
          p.position === "Goalkeeper"
            ? teamMatches.filter((m) => {
                const isHome = String(m.home_team) === String(team.id);
                return (isHome ? m.away_goals : m.home_goals) === 0;
              }).length
            : 0;

        const rating =
          6 +
          goals * 1.5 +
          assists * 0.8 +
          cleanSheets * 1 -
          yellow * 0.2 -
          red * 1;

        return {
          ...p,
          rating: Number(rating.toFixed(2)),
          stats: {
            goals,
            assists,
            cleanSheets,
            cards: { yellow, red },
            mvp: p.stats?.mvp ?? 0, // ✅ CLAVE
          },
        };
      });

      return {
        ...team,
        stats,
        points,
        roster,
      };
    });
  }, [teams, matches, matchEvents, currentSeason, isLoaded]);

  /* ===================== CONTEXT ===================== */
 const value: LeagueContextType = {
  teams: processedTeams,
  divisions,
  matches,
  matchEvents,
  players: processedTeams.flatMap(t => t.roster || []),
  isLoaded,
  sessionId,

  /* ===== TEMPORADA ===== */
  season: currentSeason,
  nextSeason: () => setCurrentSeason(s => s + 1),

  /* ===== TEAMS ===== */
  addTeam: (t) => setTeams(p => [...p, t]),
  deleteTeam: (id) =>
    setTeams(p => p.filter(t => String(t.id) !== String(id))),
  updateTeam: (u) =>
    setTeams(p => p.map(t => String(t.id) === String(u.id) ? u : t)),

  /* ===== PLAYERS ===== */
  addPlayerToTeam: (tid, p) =>
    setTeams(prev =>
      prev.map(t =>
        String(t.id) === String(tid)
          ? { ...t, roster: [...(t.roster || []), p] }
          : t
      )
    ),

  removePlayerFromTeam: (tid, pid) =>
    setTeams(prev =>
      prev.map(t =>
        String(t.id) === String(tid)
          ? {
              ...t,
              roster: (t.roster || []).filter(
                p => String(p.id) !== String(pid)
              ),
            }
          : t
      )
    ),

  /* ===== GETTERS ===== */
  getTeamById: (id) =>
    processedTeams.find(t => String(t.id) === String(id)),

  getPlayerById: (id) =>
    processedTeams.flatMap(t => t.roster || [])
      .find(p => String(p.id) === String(id)),

  getTeamByPlayerId: (pid) =>
    processedTeams.find(t =>
      (t.roster || []).some(p => String(p.id) === String(pid))
    ),

  /* ===== MATCHES ===== */
  simulateMatchday: () => {},

  getMatchEvents: (matchId) =>
    matchEvents.filter(e => String(e.match_id) === String(matchId)),

  getTeamOfTheWeek: () => [],
  getBestEleven: () => [],

  lastPlayedWeek:
    Math.max(
      1,
      ...matches
        .filter(m => m.played && Number(m.season) === currentSeason)
        .map(m => Number(m.round))
    ) || 1,

  /* ===== CLASIFICACIONES ===== */
  getLeagueQualifiers: (divisionId) => {
    const divTeams = processedTeams
      .filter(t => t.division_id === divisionId)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    return {
      titanPeak: divTeams.slice(0, 4),
      colossusShield: divTeams.slice(4, 8),
    };
  },

  getSeasonAwards: () => ({
    pichichi: undefined,
    assistMaster: undefined,
    bestGoalkeeper: undefined,
  }),

  drawTournament: async () => {},

  /* ===== DATA ===== */
  resetLeagueData: async () => {},
  importLeagueData: () => true,
  refreshData,
};

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
