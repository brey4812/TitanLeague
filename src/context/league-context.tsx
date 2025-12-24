"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, TeamOfTheWeekPlayer, MatchEvent } from "@/lib/types";
import { toast } from "sonner";

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

      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

  const lastPlayedWeek = useMemo(() => {
    const playedMatches = matches.filter(m => m.played);
    if (playedMatches.length === 0) return 1;
    const max = Math.max(...playedMatches.map(m => Number(m.round || 0)));
    return isNaN(max) ? 1 : max;
  }, [matches]);

  // --- GENERADOR DE CALENDARIO ADAPTABLE (ALGORITMO DE BERGER) ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded || !sessionId) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      // 1. Preparar lista de equipos (añadir Ghost si es impar)
      let scheduleTeams = [...divTeams].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const isOdd = scheduleTeams.length % 2 !== 0;
      if (isOdd) {
        scheduleTeams.push({ id: "ghost", name: "Descanso" } as any);
      }

      const n = scheduleTeams.length;
      const roundsPerVuelta = n - 1;
      const totalRounds = roundsPerVuelta * 2;
      
      const divMatches = matches.filter(m => Number(m.division_id) === div.id);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 0;
      const isRoundFinished = divMatches.length > 0 && 
                              divMatches.filter(m => Number(m.round) === lastRound && !m.played).length === 0;

      const targetWeek = (divMatches.length === 0) ? 1 : (isRoundFinished ? lastRound + 1 : lastRound);

      if (targetWeek > totalRounds) continue;
      if (divMatches.some(m => Number(m.round) === targetWeek)) continue;

      // 2. Lógica de Rotación Berger
      const isSecondVuelta = targetWeek > roundsPerVuelta;
      const effectiveRound = isSecondVuelta ? targetWeek - roundsPerVuelta : targetWeek;

      const fixedTeam = scheduleTeams[0];
      const rotatingTeams = scheduleTeams.slice(1);
      
      // Rotar según la jornada
      const rotationIndex = effectiveRound - 1;
      for (let i = 0; i < rotationIndex; i++) {
        rotatingTeams.unshift(rotatingTeams.pop()!);
      }

      const currentRoundOrder = [fixedTeam, ...rotatingTeams];
      const matchesToCreate: any[] = [];

      for (let i = 0; i < n / 2; i++) {
        const teamA = currentRoundOrder[i];
        const teamB = currentRoundOrder[n - 1 - i];

        // Omitir si uno es el equipo de descanso
        if (teamA.id === "ghost" || teamB.id === "ghost") continue;

        // Alternar localía e invertirla en la segunda vuelta
        const shouldInvert = (i % 2 === 0 && !isSecondVuelta) || (i % 2 !== 0 && isSecondVuelta);
        const home = shouldInvert ? teamB : teamA;
        const away = shouldInvert ? teamA : teamB;

        matchesToCreate.push({
          home_team: home.id, 
          away_team: away.id, 
          round: targetWeek, 
          played: false, 
          division_id: div.id, 
          competition: "League", 
          session_id: sessionId 
        });
      }

      if (matchesToCreate.length > 0) {
        const { data, error } = await supabase.from('matches').insert(matchesToCreate).select();
        if (data) setMatches(prev => [...prev, ...data]);
        if (error) console.error("Error Berger Algorithm:", error);
      }
    }
  }, [teams, matches, divisions, isLoaded, sessionId]);

  useEffect(() => { if (isLoaded) autoMatchmaker(); }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  // --- PROCESAMIENTO ESTADÍSTICAS ---
  const processedTeams = useMemo(() => {
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      const teamMatches = matches.filter(m => 
        m.played && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id))
      );

      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        const gFor = isHome ? Number(m.home_goals) : Number(m.away_goals);
        const gAg = isHome ? Number(m.away_goals) : Number(m.home_goals);
        stats.goalsFor += gFor;
        stats.goalsAgainst += gAg;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
      });

      const updatedRoster = (team.roster || []).map(player => {
        const pEvents = matchEvents.filter(e => String(e.player_id) === String(player.id));
        const goals = pEvents.filter(e => e.type === 'GOAL').length;
        const assists = matchEvents.filter(e => (String((e as any).assist_name) === player.name) || (e.type === 'ASSIST' && String(e.player_id) === String(player.id))).length;
        const cleanSheets = teamMatches.filter(m => (String(m.home_team) === String(team.id) ? Number(m.away_goals) : Number(m.home_goals)) === 0).length;

        let rating = 6.0 + (goals * 1.5) + (assists * 0.8) - (pEvents.filter(e => e.type === 'YELLOW_CARD').length * 0.5) - (pEvents.filter(e => e.type === 'RED_CARD').length * 4.0);
        if (player.position === 'Goalkeeper' || player.position === 'Defender') rating += (cleanSheets * 1.0);

        return {
          ...player,
          stats: { ...player.stats, goals, assists, cleanSheets: (player.position === 'Goalkeeper' || player.position === 'Defender') ? cleanSheets : 0, cards: { yellow: pEvents.filter(e => e.type === 'YELLOW_CARD').length, red: pEvents.filter(e => e.type === 'RED_CARD').length } },
          rating: Number(rating.toFixed(2))
        };
      });
      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents]);

  // --- RESTO DE FUNCIONES ---
  const getMatchEvents = useCallback((matchId: string | number) => {
    return matchEvents.filter(e => String(e.match_id) === String(matchId)).map(e => ({ ...e, playerName: (e as any).player_name || e.playerName, assistName: (e as any).assist_name || e.assistName, team_id: e.team_id })).sort((a, b) => a.minute - b.minute);
  }, [matchEvents]);

  const resetLeagueData = useCallback(async () => {
    if (confirm("¿Limpiar liga activa?")) {
      await supabase.from('match_events').delete().eq('session_id', sessionId);
      await supabase.from('matches').delete().eq('session_id', sessionId);
      localStorage.removeItem('league_active_teams');
      window.location.reload();
    }
  }, [sessionId]);

  return (
    <LeagueContext.Provider value={{
      teams: processedTeams, divisions, matches, matchEvents, players: processedTeams.flatMap(t => t.roster || []), isLoaded, sessionId, lastPlayedWeek,
      addTeam: (t) => setTeams(prev => [...prev, t]), deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))), updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)), addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...t.roster, p]} : t)), removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: t.roster.filter(p => String(p.id) !== String(pid))} : t)), getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)), getPlayerById: (id) => processedTeams.flatMap(t => t.roster).find(p => String(p.id) === String(id)), getTeamByPlayerId: (pid) => processedTeams.find(t => t.roster.some(p => String(p.id) === String(pid))), simulateMatchday: () => {}, getMatchEvents, getTeamOfTheWeek: (w) => [], getBestEleven: (t, v) => [], getLeagueQualifiers: (id) => ({ titanPeak: [], colossusShield: [] }), getSeasonAwards: () => ({ pichichi: undefined, assistMaster: undefined, bestGoalkeeper: undefined }), drawTournament: (name) => Promise.resolve(), resetLeagueData, importLeagueData: (d: any) => true, refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};