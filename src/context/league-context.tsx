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

  // --- CÁLCULO DE JORNADA SEGURA (ADIÓS NaN) ---
  const lastPlayedWeek = useMemo(() => {
    const playedMatches = matches.filter(m => m.played);
    if (playedMatches.length === 0) return 1;
    const max = Math.max(...playedMatches.map(m => Number(m.round || 0)));
    return isNaN(max) ? 1 : max;
  }, [matches]);

  // --- PROCESAMIENTO ESTADÍSTICAS Y RATING DINÁMICO ---
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
        const playerEvents = matchEvents.filter(e => String(e.player_id) === String(player.id));
        const goals = playerEvents.filter(e => e.type === 'GOAL').length;
        
        // Contamos asistencias desde la columna assist_name de Supabase
        const assists = matchEvents.filter(e => 
          (e.type === 'ASSIST' && String(e.player_id) === String(player.id)) || 
          (String((e as any).assist_name) === player.name)
        ).length;

        const yellows = playerEvents.filter(e => e.type === 'YELLOW_CARD').length;
        const reds = playerEvents.filter(e => e.type === 'RED_CARD').length;

        const cleanSheets = teamMatches.filter(m => {
          const isHome = String(m.home_team) === String(team.id);
          return (isHome ? Number(m.away_goals) : Number(m.home_goals)) === 0;
        }).length;

        let currentRating = 6.0;
        currentRating += (goals * 1.5) + (assists * 0.8);
        currentRating -= (yellows * 0.5) + (reds * 4.0);
        
        if (player.position === 'Goalkeeper' || player.position === 'Defender') {
           currentRating += (cleanSheets * 1.0);
        }

        return {
          ...player,
          stats: { ...player.stats, goals, assists, cleanSheets, cards: { yellow: yellows, red: reds } },
          rating: Number(currentRating.toFixed(2))
        };
      });

      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents]);

  // --- ONCE IDEAL CON RELLENO DE EMERGENCIA ---
  const getBestEleven = useCallback((type: string, value?: number): TeamOfTheWeekPlayer[] => {
    let filteredMatchIds: string[] = [];

    if (type === 'week' && value) {
      filteredMatchIds = matches.filter(m => Number(m.round) === value && m.played).map(m => String(m.id));
    } else if (type === 'month' && value) {
      const start = (value - 1) * 4 + 1;
      const end = value * 4;
      filteredMatchIds = matches.filter(m => m.round! >= start && m.round! <= end && m.played).map(m => String(m.id));
    } else {
      filteredMatchIds = matches.filter(m => m.played).map(m => String(m.id));
    }

    const teamIdsInPeriod = matches.filter(m => filteredMatchIds.includes(String(m.id))).flatMap(m => [String(m.home_team), String(m.away_team)]);

    const candidates = processedTeams
      .filter(t => teamIdsInPeriod.includes(String(t.id)))
      .flatMap(t => (t.roster || []).map(p => ({
        ...p, teamName: t.name, teamLogoUrl: t.badge_url, teamDataAiHint: t.real_team_name
      })))
      .filter(p => p.stats.cards.red === 0);

    const getTopByPos = (pos: string, limit: number) => 
      candidates.filter(p => p.position === pos).sort((a, b) => b.rating - a.rating).slice(0, limit);

    let squad = [
      ...getTopByPos('Goalkeeper', 1),
      ...getTopByPos('Defender', 4),
      ...getTopByPos('Midfielder', 3),
      ...getTopByPos('Forward', 3)
    ];

    if (squad.length < 11) {
      const currentIds = new Set(squad.map(p => String(p.id)));
      const fillers = candidates
        .filter(p => !currentIds.has(String(p.id)))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 11 - squad.length);
      squad = [...squad, ...fillers];
    }

    return squad as TeamOfTheWeekPlayer[];
  }, [processedTeams, matches]);

  const getTeamOfTheWeek = useCallback((week: number) => getBestEleven('week', week), [getBestEleven]);

  const getMatchEvents = useCallback((matchId: string | number) => {
    return matchEvents
      .filter(e => String(e.match_id) === String(matchId))
      .map(e => ({
        ...e,
        playerName: (e as any).player_name || e.playerName,
        assistName: (e as any).assist_name || e.assistName,
        team_id: e.team_id // Vital para la alineación local/visitante
      }))
      .sort((a, b) => a.minute - b.minute);
  }, [matchEvents]);

  // Funciones restantes simplificadas para evitar errores de tipo
  const getLeagueQualifiers = useCallback((divisionId: number) => {
    const sorted = processedTeams
      .filter(t => Number(t.division_id) === divisionId)
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    return { titanPeak: sorted.slice(0, 4), colossusShield: sorted.slice(4, 8) };
  }, [processedTeams]);

  const getSeasonAwards = useCallback(() => {
    const allPlayers = processedTeams.flatMap(t => t.roster);
    return {
      pichichi: [...allPlayers].sort((a, b) => b.stats.goals - a.stats.goals)[0],
      assistMaster: [...allPlayers].sort((a, b) => b.stats.assists - a.stats.assists)[0],
      bestGoalkeeper: [...allPlayers].filter(p => p.position === 'Goalkeeper').sort((a,b) => b.stats.cleanSheets - a.stats.cleanSheets)[0]
    };
  }, [processedTeams]);

  const resetLeagueData = useCallback(async () => {
    if (confirm("¿Limpiar liga activa?")) {
      await supabase.from('match_events').delete().eq('session_id', sessionId);
      await supabase.from('matches').delete().eq('session_id', sessionId);
      localStorage.removeItem('league_active_teams');
      setTeams([]);
      setMatches([]);
      setMatchEvents([]);
      window.location.reload();
    }
  }, [sessionId]);

  return (
    <LeagueContext.Provider value={{
      teams: processedTeams,
      divisions,
      matches,
      matchEvents,
      players: processedTeams.flatMap(t => t.roster || []),
      isLoaded,
      sessionId,
      lastPlayedWeek, // SOLUCIÓN AL ERROR DEL PROVIDER
      addTeam: (t) => setTeams(prev => [...prev, t]),
      deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))),
      updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)),
      addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...t.roster, p]} : t)),
      removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: t.roster.filter(p => String(p.id) !== String(pid))} : t)),
      getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)),
      getPlayerById: (id) => processedTeams.flatMap(t => t.roster).find(p => String(p.id) === String(id)),
      getTeamByPlayerId: (pid) => processedTeams.find(t => t.roster.some(p => String(p.id) === String(pid))),
      simulateMatchday: () => {}, 
      getMatchEvents,
      getTeamOfTheWeek,
      getBestEleven,
      getLeagueQualifiers,
      getSeasonAwards,
      drawTournament: (name) => Promise.resolve(), 
      resetLeagueData,
      importLeagueData: (d: any) => true,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};