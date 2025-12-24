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

  /* ===================== SESSION ID (NO TOCAR) ===================== */
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

  /* ===================== REFRESH DATA ===================== */
  const refreshData = useCallback(async () => {
    const savedTeams = localStorage.getItem("league_active_teams");
    if (savedTeams) setTeams(JSON.parse(savedTeams));

    const [matchesRes, eventsRes] = await Promise.all([
      supabase.from("matches").select("*").eq("session_id", sessionId),
      supabase.from("match_events").select("*").eq("session_id", sessionId),
    ]);

    if (matchesRes.data) setMatches(matchesRes.data);
    if (eventsRes.data) setMatchEvents(eventsRes.data);

    setIsLoaded(true);
  }, [sessionId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /* ===================== STATS + RATINGS ===================== */
  const processedTeams = useMemo<Team[]>(() => {
    if (!isLoaded) return [];

    return teams.map((team) => {
      const teamMatches = matches.filter(
        (m) =>
          m.played &&
          m.season === currentSeason &&
          (String(m.home_team) === String(team.id) ||
            String(m.away_team) === String(team.id))
      );

      const roster = (team.roster || []).map((p) => {
        const events = matchEvents.filter(
          (e) =>
            String(e.player_id) === String(p.id) &&
            teamMatches.some((m) => String(m.id) === String(e.match_id))
        );

        const goals = events.filter((e) => e.type === "GOAL").length;
        const assists = events.filter((e) => e.type === "ASSIST").length;
        const yellow = events.filter((e) => e.type === "YELLOW_CARD").length;
        const red = events.filter((e) => e.type === "RED_CARD").length;

        let rating =
          6 +
          goals * 1.3 +
          assists * 0.8 -
          yellow * 0.4 -
          red * 2;

        rating += Math.random() * 0.6 - 0.3;
        rating = Math.max(1, Math.min(10, rating));

        return {
          ...p,
          rating: Number(rating.toFixed(1)),
          matchRatings: [
            ...(p.matchRatings || []),
            {
              season: currentSeason,
              week: teamMatches.length,
              rating: Number(rating.toFixed(1)),
            },
          ],
          stats: {
            goals,
            assists,
            cleanSheets: 0,
            cards: { yellow, red },
            mvp: matches.filter(
              (m) => String(m.mvpId) === String(p.id)
            ).length,
          },
        };
      });

      return { ...team, roster };
    });
  }, [teams, matches, matchEvents, currentSeason, isLoaded]);

  /* ===================== SIMULACIÓN DE PARTIDO ===================== */
  const simulateMatchday = useCallback(async () => {
    const round =
      Math.max(0, ...matches.map((m) => Number(m.round || 0))) + 1;

    const validTeams = processedTeams.filter(
      (t) => (t.roster?.length || 0) >= 11
    );
    if (validTeams.length < 2) return;

    const home = validTeams[0];
    const away = validTeams[1];

    const homeGoals = Math.floor(Math.random() * 4);
    const awayGoals = Math.floor(Math.random() * 4);

    const { data: match } = await supabase
      .from("matches")
      .insert({
        session_id: sessionId,
        season: currentSeason,
        round,
        division_id: home.division_id,
        home_team: home.id,
        away_team: away.id,
        home_goals: homeGoals,
        away_goals: awayGoals,
        played: true,
      })
      .select()
      .single();

    if (!match) return;

    const events: MatchEvent[] = [];
    const ratings = new Map<string, number>();
    const expelled = new Set<string>();

    const randomPlayer = (team: Team) =>
      team.roster![Math.floor(Math.random() * team.roster!.length)];

    const addGoal = (team: Team) => {
      const scorer = randomPlayer(team);
      if (expelled.has(String(scorer.id))) return;

      ratings.set(String(scorer.id), (ratings.get(String(scorer.id)) || 6) + 1.5);

      events.push({
        match_id: match.id,
        team_id: team.id,
        player_id: scorer.id,
        type: "GOAL",
        minute: Math.floor(Math.random() * 90) + 1,
        session_id: sessionId,
      });
    };

    [...Array(homeGoals)].forEach(() => addGoal(home));
    [...Array(awayGoals)].forEach(() => addGoal(away));

    let mvpId: string | null = null;
    let best = -Infinity;

    ratings.forEach((v, k) => {
      if (v > best) {
        best = v;
        mvpId = k;
      }
    });

    if (mvpId) {
      await supabase.from("matches").update({ mvpId }).eq("id", match.id);
    }

    if (events.length) {
      await supabase.from("match_events").insert(events);
    }

    await refreshData();
  }, [processedTeams, matches, sessionId, currentSeason, refreshData]);

  /* ===================== CONTEXT ===================== */
  const value: LeagueContextType = {
    teams: processedTeams,
    divisions,
    matches,
    matchEvents,
    players: processedTeams.flatMap((t) => t.roster || []),
    isLoaded,
    sessionId,

    season: currentSeason,
    nextSeason: () => setCurrentSeason((s) => s + 1),

    addTeam: (t) => setTeams((p) => [...p, t]),
    deleteTeam: (id) =>
      setTeams((p) => p.filter((t) => String(t.id) !== String(id))),
    updateTeam: (u) =>
      setTeams((p) =>
        p.map((t) => (String(t.id) === String(u.id) ? u : t))
      ),

    addPlayerToTeam: (tid, p) =>
      setTeams((prev) =>
        prev.map((t) =>
          String(t.id) === String(tid)
            ? { ...t, roster: [...(t.roster || []), p] }
            : t
        )
      ),

    removePlayerFromTeam: (tid, pid) =>
      setTeams((prev) =>
        prev.map((t) =>
          String(t.id) === String(tid)
            ? {
                ...t,
                roster: (t.roster || []).filter(
                  (p) => String(p.id) !== String(pid)
                ),
              }
            : t
        )
      ),

    getTeamById: (id) =>
      processedTeams.find((t) => String(t.id) === String(id)),
    getPlayerById: (id) =>
      processedTeams
        .flatMap((t) => t.roster || [])
        .find((p) => String(p.id) === String(id)),
    getTeamByPlayerId: (pid) =>
      processedTeams.find((t) =>
        (t.roster || []).some((p) => String(p.id) === String(pid))
      ),

    simulateMatchday,
    getMatchEvents: (id) =>
      matchEvents.filter((e) => String(e.match_id) === String(id)),

    getTeamOfTheWeek: () => [],
    getBestEleven: () => [],

    lastPlayedWeek:
      Math.max(1, ...matches.map((m) => Number(m.round || 1))) || 1,

    getLeagueQualifiers: () => ({ titanPeak: [], colossusShield: [] }),

    getSeasonAwards: () => {
      const players = processedTeams.flatMap((t) => t.roster || []);
      return {
        pichichi: players.sort((a, b) => b.stats.goals - a.stats.goals)[0],
        assistMaster: players.sort(
          (a, b) => b.stats.assists - a.stats.assists
        )[0],
        bestGoalkeeper: players.find(
          (p) => p.position === "Goalkeeper"
        ),
      };
    },

    drawTournament: async () => {},
    resetLeagueData: () => {},
    importLeagueData: () => true,
    refreshData,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
