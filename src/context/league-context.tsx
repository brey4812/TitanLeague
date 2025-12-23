"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
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
  
  const isGeneratingRef = useRef(false);

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
        supabase.from('matches').select('*').order('round', { ascending: true }),
        supabase.from('match_events').select('*') 
      ]);

      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

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
        return {
          ...player,
          stats: {
            ...player.stats,
            goals: playerEvents.filter(e => e.type === 'GOAL').length,
            assists: playerEvents.filter(e => e.type === 'ASSIST').length,
            cards: {
                yellow: playerEvents.filter(e => e.type === 'YELLOW_CARD').length,
                red: playerEvents.filter(e => e.type === 'RED_CARD').length,
            }
          },
          rating: player.rating + (playerEvents.filter(e => e.type === 'GOAL').length * 0.1)
        };
      });
      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents]);

  const getLeagueQualifiers = useCallback((divisionId: number) => {
    const sorted = processedTeams
      .filter(t => Number(t.division_id) === divisionId)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.stats.goalsFor - b.stats.goalsAgainst) - (a.stats.goalsFor - a.stats.goalsAgainst);
      });
    return { titanPeak: sorted.slice(0, 4), colossusShield: sorted.slice(4, 8) };
  }, [processedTeams]);

  const drawTournament = useCallback(async (competitionName: "The Titan Peak" | "Colossus Shield") => {
    const qualifiers = getLeagueQualifiers(1);
    const leagueParticipants = competitionName === "The Titan Peak" ? qualifiers.titanPeak : qualifiers.colossusShield;
    const activeTeamIds = teams.map(t => t.id);
    const { data: externalTeams } = await supabase
      .from('teams')
      .select('id, name')
      .not('id', 'in', `(${activeTeamIds.join(',')})`)
      .limit(16 - leagueParticipants.length);

    const allParticipantIds = [...leagueParticipants.map(t => t.id), ...(externalTeams?.map(t => t.id) || [])];
    if (allParticipantIds.length < 2) {
      toast.error("No hay suficientes equipos para el sorteo");
      return;
    }
    const shuffled = [...allParticipantIds].sort(() => Math.random() - 0.5);
    const tournamentMatches = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      tournamentMatches.push({
        home_team: shuffled[i], away_team: shuffled[i + 1],
        round: 1, played: false, division_id: 99,
        competition: competitionName, home_goals: 0, away_goals: 0
      });
    }
    const { data, error } = await supabase.from('matches').insert(tournamentMatches).select();
    if (!error && data) { setMatches(prev => [...prev, ...data]); toast.success(`Sorteo de ${competitionName} completado`); }
  }, [teams, getLeagueQualifiers]);

  const getSeasonAwards = useCallback(() => {
    const allPlayers = processedTeams.flatMap(t => t.roster);
    return {
      pichichi: [...allPlayers].sort((a, b) => b.stats.goals - a.stats.goals)[0],
      assistMaster: [...allPlayers].sort((a, b) => b.stats.assists - a.stats.assists)[0],
      bestGoalkeeper: [...allPlayers].filter(p => p.position === 'Goalkeeper').sort((a,b) => b.rating - a.rating)[0]
    };
  }, [processedTeams]);

  const getMatchEvents = useCallback((matchId: string | number) => {
    return matchEvents.filter(e => String(e.match_id) === String(matchId)).sort((a, b) => a.minute - b.minute);
  }, [matchEvents]);

  const getTeamOfTheWeek = useCallback((week: number): TeamOfTheWeekPlayer[] => {
    const players = processedTeams.flatMap(t => (t.roster || []).map(p => ({
      ...p, teamName: t.name, teamLogoUrl: t.badge_url, teamDataAiHint: t.real_team_name
    })));
    return players.sort((a, b) => b.rating - a.rating).slice(0, 11);
  }, [processedTeams]);

  // --- AUTO MATCHMAKER CORREGIDO Y ROBUSTO ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded || isGeneratingRef.current) return;

    isGeneratingRef.current = true; 
    const matchesToInsert: any[] = [];

    for (const div of divisions) {
      // He quitado la restricción de 11 jugadores para que veas los partidos. 
      // Puedes volver a poner: && (t.roster?.length || 0) >= 11 si lo prefieres.
      const divTeams = teams.filter(t => Number(t.division_id) === div.id);
      
      if (divTeams.length < 2) continue;

      const divMatches = matches.filter(m => Number(m.division_id) === div.id && m.competition === "League");
      
      // Encontrar la última jornada
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 0;
      
      // Ver si hay partidos pendientes en la última jornada
      const pendingInLastRound = divMatches.filter(m => Number(m.round) === lastRound && !m.played);
      
      // Si no hay partidos, empezamos en la 1. Si los de la última ya se jugaron, vamos a la siguiente.
      let targetRound = lastRound === 0 ? 1 : (pendingInLastRound.length === 0 ? lastRound + 1 : lastRound);

      // Equipos ya ocupados en la jornada objetivo
      const busyIds = new Set(
        divMatches.filter(m => Number(m.round) === targetRound)
          .flatMap(m => [String(m.home_team), String(m.away_team)])
      );

      const availableTeams = divTeams.filter(t => !busyIds.has(String(t.id)));

      if (availableTeams.length >= 2) {
        const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length - 1; i += 2) {
          const teamA = shuffled[i];
          const teamB = shuffled[i+1];

          if (busyIds.has(String(teamA.id)) || busyIds.has(String(teamB.id))) continue;

          matchesToInsert.push({
            home_team: teamA.id, 
            away_team: teamB.id,
            round: targetRound, 
            played: false, 
            division_id: div.id,
            competition: "League", 
            home_goals: 0, 
            away_goals: 0
          });

          busyIds.add(String(teamA.id));
          busyIds.add(String(teamB.id));
        }
      }
    }

    if (matchesToInsert.length > 0) {
      const { data, error } = await supabase.from('matches').insert(matchesToInsert).select();
      if (!error && data) {
        setMatches(prev => [...prev, ...data]);
      } else if (error) {
        console.error("Error al insertar partidos:", error);
      }
    }
    
    isGeneratingRef.current = false; 
  }, [teams, matches, divisions, isLoaded]);

  // Se dispara cuando cambian los partidos o los equipos
  useEffect(() => { 
    if (isLoaded && teams.length >= 2) {
      autoMatchmaker(); 
    }
  }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  const resetLeagueData = useCallback(() => {
    if (confirm("¿Limpiar liga activa?")) {
      localStorage.removeItem('league_active_teams');
      setTeams([]);
      setMatches([]);
      setMatchEvents([]);
      toast.info("Datos locales reseteados");
      window.location.reload();
    }
  }, []);

  return (
    <LeagueContext.Provider value={{
      teams: processedTeams,
      divisions,
      matches,
      matchEvents,
      players: processedTeams.flatMap(t => t.roster || []),
      isLoaded,
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
      getBestEleven: (type) => getTeamOfTheWeek(1), 
      getLeagueQualifiers,
      getSeasonAwards,
      drawTournament,
      resetLeagueData,
      importLeagueData: (d: any) => true,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};