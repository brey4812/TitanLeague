"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, TeamOfTheWeekPlayer, MatchEvent } from "@/lib/types";

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
  const [currentSeason, setCurrentSeason] = useState(1); // Control de temporadas

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
      const [matchesRes, eventsRes] = await Promise.all([
        supabase.from('matches').select('*').eq('session_id', sessionId).order('round', { ascending: true }),
        supabase.from('match_events').select('*').eq('session_id', sessionId)
      ]);
      if (matchesRes.data) {
        setMatches(matchesRes.data);
        // Detectar en qué temporada estamos basado en el partido más reciente
        const maxSeason = Math.max(...matchesRes.data.map(m => (m as any).season || 1), 1);
        setCurrentSeason(maxSeason);
      }
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error refreshData:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // --- MOTOR DE PARTIDOS CORREGIDO (SOLUCIÓN JORNADA 1) ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded || !sessionId || currentSeason > 10) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      let scheduleTeams = [...divTeams].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      if (scheduleTeams.length % 2 !== 0) scheduleTeams.push({ id: "ghost", name: "Descanso" } as any);

      const n = scheduleTeams.length;
      const roundsPerVuelta = n - 1;
      const totalRounds = roundsPerVuelta * 2;

      // Filtrar partidos por división y temporada actual
      const divMatches = matches.filter(m => Number(m.division_id) === div.id && ((m as any).season || 1) === currentSeason);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 0;
      const isRoundFinished = divMatches.length > 0 && divMatches.filter(m => Number(m.round) === lastRound && !m.played).length === 0;

      // Determinar jornada
      const targetWeek = (divMatches.length === 0) ? 1 : (isRoundFinished ? lastRound + 1 : lastRound);

      // Si la temporada terminó, no generar más en esta temporada
      if (targetWeek > totalRounds) continue;
      if (divMatches.some(m => Number(m.round) === targetWeek)) continue;

      const isSecondVuelta = targetWeek > roundsPerVuelta;
      const effectiveRound = isSecondVuelta ? targetWeek - roundsPerVuelta : targetWeek;
      
      // Algoritmo de Berger (Rotación Fija) corregido para Jornada 1
      const fixed = scheduleTeams[0];
      const rest = scheduleTeams.slice(1);
      const rotationIndex = (effectiveRound - 1) % roundsPerVuelta;
      
      for (let i = 0; i < rotationIndex; i++) rest.unshift(rest.pop()!);
      const currentRound = [fixed, ...rest];

      const matchesToCreate: any[] = [];
      for (let i = 0; i < n / 2; i++) {
        const teamA = currentRound[i];
        const teamB = currentRound[n - 1 - i];
        if (teamA.id === "ghost" || teamB.id === "ghost") continue;
        
        const shouldInvert = (i % 2 === 0 && !isSecondVuelta) || (i % 2 !== 0 && isSecondVuelta);
        
        matchesToCreate.push({
          home_team: shouldInvert ? teamB.id : teamA.id,
          away_team: shouldInvert ? teamA.id : teamB.id,
          round: targetWeek,
          played: false,
          division_id: div.id,
          competition: "League",
          session_id: sessionId,
          season: currentSeason // Guardar temporada
        });
      }

      if (matchesToCreate.length > 0) {
        const { data } = await supabase.from('matches').insert(matchesToCreate).select();
        if (data) setMatches(prev => [...prev, ...data]);
      }
    }
  }, [teams, matches, divisions, isLoaded, sessionId, currentSeason]);

  useEffect(() => { if (isLoaded) autoMatchmaker(); }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  // --- PROCESAMIENTO ESTADÍSTICAS ---
  const processedTeams = useMemo(() => {
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      // Solo contar partidos de la temporada actual para la tabla
      const teamMatches = matches.filter(m => m.played && ((m as any).season || 1) === currentSeason && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)));
      
      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        const gFor = isHome ? Number(m.home_goals) : Number(m.away_goals);
        const gAg = isHome ? Number(m.away_goals) : Number(m.home_goals);
        stats.goalsFor += gFor; stats.goalsAgainst += gAg;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
      });

      const updatedRoster = (team.roster || []).map(player => {
        // Eventos filtrados por temporada
        const relevantMatches = matches.filter(m => ((m as any).season || 1) === currentSeason).map(m => String(m.id));
        const pEvents = matchEvents.filter(e => String(e.player_id) === String(player.id) && relevantMatches.includes(String(e.match_id)));
        
        const goals = pEvents.filter(e => e.type === 'GOAL').length;
        const assists = matchEvents.filter(e => relevantMatches.includes(String(e.match_id)) && ((String((e as any).assist_name) === player.name) || (e.type === 'ASSIST' && String(e.player_id) === String(player.id)))).length;
        const cleanSheets = teamMatches.filter(m => (String(m.home_team) === String(team.id) ? Number(m.away_goals) : Number(m.home_goals)) === 0).length;
        
        let rating = 6.0 + (goals * 1.5) + (assists * 0.8);
        if (player.position === 'Goalkeeper' || player.position === 'Defender') rating += (cleanSheets * 1.0);
        
        return {
          ...player,
          stats: { ...player.stats, goals, assists, cleanSheets, cards: { yellow: pEvents.filter(e => e.type === 'YELLOW_CARD').length, red: pEvents.filter(e => e.type === 'RED_CARD').length } },
          rating: Number(rating.toFixed(2))
        };
      });
      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents, currentSeason]);

  // --- LÓGICA DE ONCES (SEMANAL, MENSUAL, ANUAL) ---
  const getBestEleven = useCallback((type: string, value?: number): TeamOfTheWeekPlayer[] => {
    let filteredMatchIds: string[] = [];
    
    if (type === 'week' && value) {
      filteredMatchIds = matches.filter(m => Number(m.round) === value && ((m as any).season || 1) === currentSeason && m.played).map(m => String(m.id));
    } else if (type === 'month' && value) {
      // Mes 1: Semanas 1-4, Mes 2: Semanas 5-8...
      const start = (value - 1) * 4 + 1;
      const end = value * 4;
      filteredMatchIds = matches.filter(m => Number(m.round) >= start && Number(m.round) <= end && ((m as any).season || 1) === currentSeason && m.played).map(m => String(m.id));
    } else {
      // Anual (Toda la temporada actual)
      filteredMatchIds = matches.filter(m => ((m as any).season || 1) === currentSeason && m.played).map(m => String(m.id));
    }

    const teamIdsInPeriod = matches.filter(m => filteredMatchIds.includes(String(m.id))).flatMap(m => [String(m.home_team), String(m.away_team)]);
    const candidates = processedTeams.filter(t => teamIdsInPeriod.includes(String(t.id))).flatMap(t => (t.roster || []).map(p => ({ ...p, teamName: t.name, teamLogoUrl: t.badge_url, teamDataAiHint: t.real_team_name }))).filter(p => p.stats.cards.red === 0);
    const getTopByPos = (pos: string, limit: number) => candidates.filter(p => p.position === pos).sort((a, b) => b.rating - a.rating).slice(0, limit);

    let squad = [...getTopByPos('Goalkeeper', 1), ...getTopByPos('Defender', 4), ...getTopByPos('Midfielder', 3), ...getTopByPos('Forward', 3)];
    if (squad.length < 11) {
      const currentIds = new Set(squad.map(p => String(p.id)));
      squad = [...squad, ...candidates.filter(p => !currentIds.has(String(p.id))).sort((a, b) => b.rating - a.rating).slice(0, 11 - squad.length)];
    }
    return squad as TeamOfTheWeekPlayer[];
  }, [processedTeams, matches, currentSeason]);

  const lastPlayedWeek = useMemo(() => {
    const playedMatches = matches.filter(m => m.played && ((m as any).season || 1) === currentSeason);
    if (playedMatches.length === 0) return 1;
    return Math.max(...playedMatches.map(m => Number(m.round || 0)));
  }, [matches, currentSeason]);

  const resetLeagueData = useCallback(async () => {
    if (confirm("¿Limpiar liga?")) {
      await supabase.from('match_events').delete().eq('session_id', sessionId);
      await supabase.from('matches').delete().eq('session_id', sessionId);
      localStorage.removeItem('league_active_teams');
      window.location.reload();
    }
  }, [sessionId]);

  return (
    <LeagueContext.Provider value={{
      teams: processedTeams, divisions, matches, matchEvents, players: processedTeams.flatMap(t => t.roster || []), isLoaded, sessionId, lastPlayedWeek,
      season: currentSeason, // Exponer temporada
      nextSeason: () => currentSeason < 10 && setCurrentSeason(prev => prev + 1), // Función para avanzar
      addTeam: (t) => setTeams(prev => [...prev, t]), deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))), updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)), addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...t.roster, p]} : t)), removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: t.roster.filter(p => String(p.id) !== String(pid))} : t)), getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)), getPlayerById: (id) => processedTeams.flatMap(t => t.roster).find(p => String(p.id) === String(id)), getTeamByPlayerId: (pid) => processedTeams.find(t => t.roster.some(p => String(p.id) === String(pid))), simulateMatchday: () => {}, getMatchEvents: (id) => matchEvents.filter(e => String(e.match_id) === String(id)), getTeamOfTheWeek: (w) => getBestEleven('week', w), getBestEleven, getLeagueQualifiers: (id) => ({ titanPeak: [], colossusShield: [] }), getSeasonAwards: () => ({ pichichi: undefined, assistMaster: undefined, bestGoalkeeper: undefined }), drawTournament: (name) => Promise.resolve(), resetLeagueData, importLeagueData: (d: any) => true, refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};