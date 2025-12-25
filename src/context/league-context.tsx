"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Team, Player, MatchResult, Division, 
  LeagueContextType, TeamOfTheWeekPlayer, MatchEvent 
} from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);

  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('league_session_id');
      if (!id) {
        id = Math.random().toString(36).substring(7);
        localStorage.setItem('league_session_id', id);
      }
      return id;
    }
    return '';
  });

  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" }
  ];

  const refreshData = useCallback(async () => {
    try {
      const { data: dbTeams } = await supabase.from('teams').select('*, players(*)');
      
      if (dbTeams && dbTeams.length > 0) {
        setTeams(dbTeams.map((t: any) => ({ ...t, roster: t.players || [] })));
      } else {
        const saved = localStorage.getItem('league_active_teams');
        if (saved) setTeams(JSON.parse(saved));
      }

      const [matchesRes, eventsRes, seasonRes] = await Promise.all([
        supabase.from('matches').select('*').eq('session_id', sessionId).order('round', { ascending: true }),
        supabase.from('match_events').select('*').eq('session_id', sessionId),
        supabase.from('seasons').select('season_number').eq('is_active', true).maybeSingle()
      ]);

      if (seasonRes.data) setCurrentSeason(Number(seasonRes.data.season_number));
      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error refreshData:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // --- SIMULACIÓN AVANZADA (UNIFICADA CON API) ---
  const simulateMatchday = useCallback(async () => {
    try {
      // Obtenemos la semana actual no jugada de la primera división como referencia
      const weekToSimulate = matches.find(m => !m.played && m.division_id === 1)?.round || 1;
      
      setIsLoaded(false);
      // Simulamos para todas las divisiones
      await Promise.all(divisions.map(div => 
        fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ divisionId: div.id, week: weekToSimulate, sessionId }),
        })
      ));
      
      await refreshData();
    } catch (error) {
      console.error("Simulación fallida:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId, matches, refreshData, divisions]);

  // --- MOTOR DE PARTIDOS BERGER (CALENDARIO) ---
  const autoMatchmaker = useCallback(async () => {
    if (!isLoaded || teams.length < 2 || !sessionId) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      let scheduleTeams = [...divTeams].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      if (scheduleTeams.length % 2 !== 0) scheduleTeams.push({ id: "ghost", name: "Descanso" } as any);

      const n = scheduleTeams.length;
      const roundsPerVuelta = n - 1;
      const divMatches = matches.filter(m => Number(m.division_id) === div.id && (Number(m.season) || 1) === currentSeason);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round || 0))) : 0;
      const isRoundFinished = divMatches.length > 0 && divMatches.every(m => m.round !== lastRound || m.played);

      const targetWeek = (divMatches.length === 0) ? 1 : (isRoundFinished ? lastRound + 1 : lastRound);

      if (targetWeek > roundsPerVuelta * 2 || divMatches.some(m => Number(m.round) === targetWeek)) continue;

      const isSecondVuelta = targetWeek > roundsPerVuelta;
      const effectiveRound = isSecondVuelta ? targetWeek - roundsPerVuelta : targetWeek;
      const fixed = scheduleTeams[0];
      const rest = scheduleTeams.slice(1);
      const rotationIndex = (effectiveRound - 1) % roundsPerVuelta;
      for (let i = 0; i < rotationIndex; i++) rest.unshift(rest.pop()!);
      const currentRound = [fixed, ...rest];

      const matchesToCreate = [];
      for (let i = 0; i < n / 2; i++) {
        const teamA = currentRound[i];
        const teamB = currentRound[n - 1 - i];
        if (teamA.id === "ghost" || teamB.id === "ghost") continue;
        const shouldInvert = (i % 2 === 0 && !isSecondVuelta) || (i % 2 !== 0 && isSecondVuelta);
        
        matchesToCreate.push({
          home_team: shouldInvert ? teamB.id : teamA.id,
          away_team: shouldInvert ? teamA.id : teamB.id,
          round: targetWeek, played: false, division_id: div.id, 
          competition: "League", session_id: sessionId, season: currentSeason 
        });
      }

      if (matchesToCreate.length > 0) {
        const { data } = await supabase.from('matches').insert(matchesToCreate).select();
        if (data) setMatches(prev => [...prev, ...data]);
      }
    }
  }, [teams, matches, isLoaded, sessionId, currentSeason, divisions]);

  useEffect(() => { 
    const timer = setTimeout(() => { if (isLoaded) autoMatchmaker(); }, 1500);
    return () => clearTimeout(timer);
  }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  // --- PROCESAMIENTO ESTADÍSTICAS ---
  const processedTeams = useMemo(() => {
    if (!isLoaded || teams.length === 0) return [];
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      const teamMatches = matches.filter(m => m.played && (Number(m.season) || 1) === currentSeason && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)));
      
      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        stats.goalsFor += isHome ? m.home_goals : m.away_goals;
        stats.goalsAgainst += isHome ? m.away_goals : m.home_goals;
        const gFor = isHome ? m.home_goals : m.away_goals;
        const gAg = isHome ? m.away_goals : m.home_goals;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
      });
      return { ...team, stats, points: stats.points };
    });
  }, [teams, matches, currentSeason, isLoaded]);

  // --- VALUE PARA PROVIDER (CUMPLIENDO TYPES.TS) ---
  const value: LeagueContextType = {
    teams: processedTeams,
    divisions,
    matches,
    matchEvents,
    players: teams.flatMap(t => t.roster || []),
    isLoaded,
    sessionId,
    season: currentSeason,
    nextSeason: () => setCurrentSeason(prev => prev + 1),
    addTeam: (t) => setTeams(prev => [...prev, t]),
    deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))),
    updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)),
    addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...(t.roster || []), p]} : t)),
    removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: (t.roster || []).filter(p => String(p.id) !== String(pid))} : t)),
    getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)),
    getPlayerById: (id) => teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)),
    getTeamByPlayerId: (pid) => teams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))),
    simulateMatchday,
    getMatchEvents: (id) => matchEvents.filter(e => String(e.match_id) === String(id)),
    getTeamOfTheWeek: (w) => [], 
    getBestEleven: (type, val) => [], 
    lastPlayedWeek: matches.filter(m => m.played && (Number(m.season) || 1) === currentSeason).length === 0 ? 1 : Math.max(...matches.filter(m => m.played).map(m => Number(m.round || 0))),
    getLeagueQualifiers: (divId) => {
      const divTeams = processedTeams.filter(t => Number(t.division_id) === divId).sort((a,b) => (b.points || 0) - (a.points || 0));
      return { titanPeak: divTeams.slice(0, 4), colossusShield: divTeams.slice(4, 8) };
    },
    getSeasonAwards: () => ({ pichichi: undefined, assistMaster: undefined, bestGoalkeeper: undefined }),
    drawTournament: async (name) => console.log("Sorteando", name),
    resetLeagueData: async () => {
      if (!confirm("¿Resetear?")) return;
      await Promise.all([
        supabase.from('matches').delete().eq('session_id', sessionId),
        supabase.from('match_events').delete().eq('session_id', sessionId)
      ]);
      localStorage.clear();
      window.location.reload();
    },
    importLeagueData: (newData) => {
      try {
        const teamsToSave = newData.teams || newData;
        localStorage.setItem('league_active_teams', JSON.stringify(teamsToSave));
        setTeams(teamsToSave);
        return true;
      } catch (e) { return false; }
    },
    refreshData
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};