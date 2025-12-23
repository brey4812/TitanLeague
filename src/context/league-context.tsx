"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType } from "@/lib/types";
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

  useEffect(() => {
    if (isLoaded) localStorage.setItem('league_active_teams', JSON.stringify(teams));
  }, [teams, isLoaded]);

  // --- LÓGICA EDITADA: EMPAREJAMIENTOS ESTRICTOS ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => 
        Number(t.division_id) === div.id && 
        (t.roster?.length || 0) >= 11
      );

      if (divTeams.length < 2) continue;

      const divMatches = matches.filter(m => Number(m.division_id) === div.id);
      
      // 1. Determinar la jornada de trabajo correcta
      // Si hay partidos pendientes en la última jornada creada, nos quedamos ahí.
      // Si todos los de la última jornada están jugados, la siguiente es round + 1.
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 1;
      const pendingInLastRound = divMatches.filter(m => Number(m.round) === lastRound && !m.played);
      
      const currentWeek = (divMatches.length > 0 && pendingInLastRound.length === 0) 
        ? lastRound + 1 
        : lastRound;

      // 2. Ver qué equipos ya tienen partido en ESTA jornada específica
      const busyTeamIds = new Set(
        divMatches
          .filter(m => Number(m.round) === currentWeek)
          .flatMap(m => [String(m.home_team), String(m.away_team)])
      );

      // 3. Filtrar equipos libres
      const availableTeams = divTeams.filter(t => !busyTeamIds.has(String(t.id)));

      // 4. Generar duelos solo si hay parejas disponibles
      if (availableTeams.length >= 2) {
        // Importante: i += 2 para no repetir equipos en la misma vuelta
        for (let i = 0; i < availableTeams.length - 1; i += 2) {
          const teamA = availableTeams[i];
          const teamB = availableTeams[i + 1];

          const { data, error } = await supabase.from('matches').insert({
            home_team: teamA.id, 
            away_team: teamB.id,
            round: currentWeek,
            played: false,
            division_id: div.id,
            competition: "League",
            home_goals: 0,
            away_goals: 0
          }).select();

          if (!error && data) {
            setMatches(prev => [...prev, data[0]]);
            toast.success(`Jornada ${currentWeek}: ${teamA.name} vs ${teamB.name}`);
          }
        }
      }
    }
  }, [teams, matches, divisions, isLoaded]);

  useEffect(() => {
    if (isLoaded) autoMatchmaker();
  }, [teams, matches.length, isLoaded, autoMatchmaker]);

  // --- RESTO DE FUNCIONES (Sin cambios para mantener estabilidad) ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => prev.find(t => String(t.id) === String(newTeam.id)) ? prev : [...prev, newTeam]);
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    setMatches(prev => prev.filter(m => String(m.home_team) !== String(id) && String(m.away_team) !== String(id)));
    toast.success("Equipo quitado de la liga");
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? updated : t));
  }, []);

  const addPlayerToTeam = useCallback((teamId: number | string, player: Player) => {
    setTeams(prev => prev.map(team => String(team.id) === String(teamId) 
      ? { ...team, roster: [...(team.roster || []), player] } : team));
  }, []);

  const removePlayerFromTeam = useCallback((teamId: number | string, playerId: number | string) => {
    setTeams(prev => prev.map(team => String(team.id) === String(teamId) 
      ? { ...team, roster: (team.roster || []).filter(p => String(p.id) !== String(playerId)) } : team));
  }, []);

  const getTeamById = useCallback((id: number | string) => teams.find(t => String(t.id) === String(id)), [teams]);
  const getPlayerById = useCallback((id: number | string) => teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)), [teams]);
  const getTeamByPlayerId = useCallback((pid: number | string) => teams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))), [teams]);

  const resetLeagueData = () => {
    if (confirm("¿Limpiar liga activa?")) {
      setTeams([]);
      localStorage.removeItem('league_active_teams');
      window.location.reload();
    }
  };

  return (
    <LeagueContext.Provider value={{
      teams, divisions, matches, players: teams.flatMap(t => t.roster || []), isLoaded,
      addTeam, deleteTeam, updateTeam, addPlayerToTeam, removePlayerFromTeam,
      getTeamById, getPlayerById, getTeamByPlayerId, simulateMatchday: () => {},
      getTeamOfTheWeek: (week: number) => [], getBestEleven: (type: string, val?: number) => [],
      resetLeagueData, importLeagueData: (d: any) => true, refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};