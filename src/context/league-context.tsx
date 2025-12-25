"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, TeamOfTheWeekPlayer, MatchEvent } from "@/lib/types";
import { calculatePlayerRating } from "@/lib/calculatePlayerRating";

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
      const savedTeams = localStorage.getItem('league_active_teams');
      if (savedTeams) setTeams(JSON.parse(savedTeams));
      
      const [matchesRes, eventsRes, seasonRes] = await Promise.all([
        supabase.from('matches').select('*').eq('session_id', sessionId).order('round', { ascending: true }),
        supabase.from('match_events').select('*').eq('session_id', sessionId),
        // CORRECCIÓN: Nombre exacto de columna 'season_number'
        supabase.from('seasons').select('season_number').eq('is_active', true).maybeSingle()
      ]);

      if (seasonRes.data) setCurrentSeason(Number(seasonRes.data.season_number) || 1);
      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error refreshData Titán:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const autoMatchmaker = useCallback(async () => {
    if (!isLoaded || teams.length < 2 || !sessionId) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      let scheduleTeams = [...divTeams].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      if (scheduleTeams.length % 2 !== 0) scheduleTeams.push({ id: "ghost", name: "Descanso" } as any);

      const n = scheduleTeams.length;
      const roundsPerVuelta = n - 1;
      const totalRounds = roundsPerVuelta * 2;
      
      const divMatches = matches.filter(m => Number(m.division_id) === div.id && (Number(m.season) || 1) === currentSeason);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round || 0))) : 0;
      const isRoundFinished = divMatches.length > 0 && divMatches.every(m => m.round !== lastRound || m.played);
      const targetWeek = (divMatches.length === 0) ? 1 : (isRoundFinished ? lastRound + 1 : lastRound);

      if (targetWeek > totalRounds || divMatches.some(m => Number(m.round) === targetWeek)) continue;

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
  }, [teams, matches, isLoaded, sessionId, currentSeason]);

  useEffect(() => { 
    const timer = setTimeout(() => { if (isLoaded) autoMatchmaker(); }, 2000);
    return () => clearTimeout(timer);
  }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  const processedTeams = useMemo(() => {
    // CORRECCIÓN: Guardia de carga para evitar Error #310
    if (!isLoaded || teams.length === 0) return [];

    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      const teamMatches = matches.filter(m => m.played && (Number(m.season) || 1) === currentSeason && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)));
      
      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        const gFor = isHome ? m.home_goals : m.away_goals;
        const gAg = isHome ? m.away_goals : m.home_goals;
        stats.goalsFor += gFor; stats.goalsAgainst += gAg;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
      });

      const updatedRoster = (team.roster || []).map(player => {
        const playerMatchRatings: number[] = [];
        teamMatches.forEach(match => {
          const eventsInMatch = matchEvents.filter(e => String(e.match_id) === String(match.id));
          const isHome = String(match.home_team) === String(team.id);
          const cleanSheet = (isHome ? match.away_goals : match.home_goals) === 0;
          playerMatchRatings.push(calculatePlayerRating(player, eventsInMatch, cleanSheet));
        });

        const pEvents = matchEvents.filter(e => String(e.player_id) === String(player.id));
        const avgRating = playerMatchRatings.length > 0 
          ? Number((playerMatchRatings.reduce((a, b) => a + b, 0) / playerMatchRatings.length).toFixed(2))
          : 6.0;

        return {
          ...player,
          rating: avgRating,
          stats: {
            ...player.stats,
            goals: pEvents.filter(e => e.type === 'GOAL').length,
            // CORRECCIÓN: Normalización de nombres para TypeScript
            assists: matchEvents.filter(e => e.type === 'ASSIST' && (String(e.player_id) === String(player.id) || (e as any).assist_name === player.name)).length,
            cards: {
              yellow: pEvents.filter(e => e.type === 'YELLOW_CARD').length,
              red: pEvents.filter(e => e.type === 'RED_CARD').length
            }
          }
        };
      });

      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents, currentSeason, isLoaded]);

  const value: LeagueContextType = {
    teams: processedTeams,
    divisions,
    matches,
    matchEvents,
    players: processedTeams.flatMap(t => t.roster || []),
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
    getPlayerById: (id) => processedTeams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)),
    getTeamByPlayerId: (pid) => processedTeams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))),
    simulateMatchday: async () => { /* tu fetch a /api/simulate */ },
    getMatchEvents: (id) => matchEvents.filter(e => String(e.match_id) === String(id)).map(e => ({
      ...e,
      // CORRECCIÓN: Normalización de nombres para el Dashboard
      playerName: (e as any).player_name || e.playerName,
      assistName: (e as any).assist_name || e.assistName
    })),
    getTeamOfTheWeek: (w) => {
        const weekMatchIds = matches.filter(m => Number(m.round) === w && m.played).map(m => String(m.id));
        const candidates = processedTeams.flatMap(t => t.roster || []).filter(p => 
            matchEvents.some(e => weekMatchIds.includes(String(e.match_id)) && String(e.player_id) === String(p.id))
        );
        return candidates.sort((a,b) => b.rating - a.rating).slice(0, 11) as any;
    },
    getBestEleven: (t, v) => [],
    lastPlayedWeek: matches.filter(m => m.played).length === 0 ? 1 : Math.max(...matches.filter(m => m.played).map(m => Number(m.round || 0))),
    getLeagueQualifiers: (divId) => {
      const divTeams = processedTeams.filter(t => Number(t.division_id) === divId).sort((a,b) => (b.points || 0) - (a.points || 0));
      return { titanPeak: divTeams.slice(0, 4), colossusShield: divTeams.slice(4, 8) };
    },
    getSeasonAwards: () => ({ pichichi: undefined, assistMaster: undefined, bestGoalkeeper: undefined }),
    drawTournament: async (n) => {}, 
    resetLeagueData: async () => { if(confirm("¿Reset?")) { localStorage.clear(); window.location.reload(); } },
    importLeagueData: (newData) => { localStorage.setItem('league_active_teams', JSON.stringify(newData)); setTeams(newData); return true; },
    refreshData
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};