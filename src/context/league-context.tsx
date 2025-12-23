"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, TeamOfTheWeekPlayer } from "@/lib/types";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" }
  ];

  // --- REFRESCAR DATOS ---
  const refreshData = useCallback(async () => {
    try {
      const savedTeams = localStorage.getItem('league_active_teams');
      if (savedTeams) setTeams(JSON.parse(savedTeams));

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true });

      if (matchesData) setMatches(matchesData);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  // --- LÓGICA DE ESTADÍSTICAS Y TABLA DE POSICIONES ---
  // Recalculamos la tabla cada vez que cambian los partidos
  const processedTeams = useMemo(() => {
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
      
      matches.filter(m => m.played && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)))
        .forEach(m => {
          const isHome = String(m.home_team) === String(team.id);
          const gFor = isHome ? m.home_goals : m.away_goals;
          const gAg = isHome ? m.away_goals : m.home_goals;
          
          stats.goalsFor += gFor;
          stats.goalsAgainst += gAg;
          
          if (gFor > gAg) stats.wins += 1;
          else if (gFor === gAg) stats.draws += 1;
          else stats.losses += 1;
        });

      return { ...team, stats };
    });
  }, [teams, matches]);

  // --- LÓGICA DEL 11 DE LA JORNADA Y ESTADÍSTICAS DE JUGADORES ---
  const getTeamOfTheWeek = useCallback((week: number): TeamOfTheWeekPlayer[] => {
    // Aquí filtramos los jugadores que destacaron en los partidos de la semana 'week'
    // Por ahora devolvemos los mejores por rating de los equipos que jugaron
    const playersInWeek = processedTeams
      .flatMap(t => t.roster.map(p => ({ ...p, teamName: t.name, teamLogoUrl: t.badge_url, teamDataAiHint: t.real_team_name })));
    
    return playersInWeek.sort((a, b) => b.rating - a.rating).slice(0, 11);
  }, [processedTeams]);

  // --- LÓGICA DE EMPAREJAMIENTOS ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      const divMatches = matches.filter(m => m.division_id === div.id);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 1;
      const pendingInLastRound = divMatches.filter(m => Number(m.round) === lastRound && !m.played);
      
      const currentWeek = (divMatches.length > 0 && pendingInLastRound.length === 0) ? lastRound + 1 : lastRound;

      const busyTeamIds = new Set(
        divMatches.filter(m => Number(m.round) === currentWeek).flatMap(m => [String(m.home_team), String(m.away_team)])
      );

      const availableTeams = divTeams.filter(t => !busyTeamIds.has(String(t.id)));

      if (availableTeams.length >= 2) {
        const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length - 1; i += 2) {
          const { data, error } = await supabase.from('matches').insert({
            home_team: shuffled[i].id, 
            away_team: shuffled[i+1].id,
            round: currentWeek, played: false, division_id: div.id,
            competition: "League", home_goals: 0, away_goals: 0
          }).select();

          if (!error && data) {
            setMatches(prev => [...prev, data[0]]);
            toast.success(`Nueva Jornada ${currentWeek}: ${shuffled[i].name} vs ${shuffled[i+1].name}`);
          }
        }
      }
    }
  }, [teams, matches, divisions, isLoaded]);

  useEffect(() => { if (isLoaded) autoMatchmaker(); }, [matches.length, isLoaded, autoMatchmaker]);

  // --- RENDERIZADO DEL CONTEXTO ---
  return (
    <LeagueContext.Provider value={{
      teams: processedTeams, // Usamos los equipos con estadísticas calculadas
      divisions,
      matches,
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
      getTeamOfTheWeek,
      getBestEleven: (type) => getTeamOfTheWeek(1), // Simplificado para el ejemplo
      resetLeagueData: () => { localStorage.removeItem('league_active_teams'); window.location.reload(); },
      importLeagueData: () => true,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};