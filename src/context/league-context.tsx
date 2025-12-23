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
        .order('round', { ascending: true }); // Ordenamos por jornada

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

  // --- LÓGICA CORREGIDA: EMPAREJAMIENTOS REALES ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded) return;

    for (const div of divisions) {
      // 1. Filtrar equipos listos de esta división
      const divTeams = teams.filter(t => 
        Number(t.division_id) === div.id && 
        (t.roster?.length || 0) >= 11
      );

      if (divTeams.length < 2) continue;

      // 2. Determinar en qué jornada estamos trabajando
      // Buscamos la jornada más alta actual para esta división
      const divMatches = matches.filter(m => m.division_id === div.id);
      const currentWeek = divMatches.length > 0 
        ? Math.max(...divMatches.map(m => Number(m.round) || 1)) 
        : 1;

      // 3. Ver qué equipos YA tienen partido en esta jornada
      const busyTeamIds = new Set(
        divMatches
          .filter(m => Number(m.round) === currentWeek)
          .flatMap(m => [String(m.home_team), String(m.away_team)])
      );

      // 4. Filtrar equipos que están LIBRES
      const availableTeams = divTeams.filter(t => !busyTeamIds.has(String(t.id)));

      // 5. Emparejar de dos en dos (Solo si hay al menos un par disponible)
      if (availableTeams.length >= 2) {
        for (let i = 0; i < availableTeams.length - 1; i += 2) {
          const teamA = availableTeams[i];
          const teamB = availableTeams[i + 1];

          console.log(`Generando duelo: ${teamA.name} vs ${teamB.name} (Jornada ${currentWeek})`);

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
            toast.success(`Duelo Jornada ${currentWeek}: ${teamA.name} vs ${teamB.name}`);
          } else if (error) {
            console.error("Error Supabase:", error);
          }
        }
      }
    }
  }, [teams, matches, divisions, isLoaded]);

  useEffect(() => {
    if (isLoaded) autoMatchmaker();
  }, [teams, matches.length, isLoaded, autoMatchmaker]);

  // --- GESTIÓN DE EQUIPOS Y JUGADORES ---
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