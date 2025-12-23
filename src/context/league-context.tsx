"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, TeamOfTheWeekPlayer, Division, LeagueContextType } from "@/lib/types";

// Inicialización de Supabase con tus variables de entorno
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

  // --- NUEVA FUNCIÓN: CARGA REAL DESDE SUPABASE ---
  // Esta función es la que hace que los partidos aparezcan en el panel
  const refreshData = useCallback(async () => {
    try {
      // Traemos equipos con sus jugadores vinculados
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, roster:players(*)');
      
      // Traemos todos los partidos de la tabla 'matches'
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*');

      if (teamsData) setTeams(teamsData);
      if (matchesData) setMatches(matchesData);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Carga inicial al abrir la app
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- GESTIÓN DE EQUIPOS (Mantenida) ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => {
      if (prev.find(t => String(t.id) === String(newTeam.id))) return prev;
      const formattedTeam = {
        ...newTeam,
        badge_url: newTeam.badge_url || (newTeam as any).logo || '/placeholder-team.png',
        roster: (newTeam.roster || []).slice(0, 20)
      };
      return [...prev, formattedTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
  }, []);

  // --- NUEVA FUNCIÓN: IMPORTACIÓN ---
  const importLeagueData = useCallback((newData: any) => {
    try {
      if (!newData.teams) throw new Error("Formato inválido");
      setTeams(newData.teams);
      setMatches(newData.matches || []);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // --- BÚSQUEDAS (Esenciales para que DashboardClient funcione) ---
  const getTeamById = useCallback((id: number | string) => 
    teams.find(t => String(t.id) === String(id)), [teams]);
  
  const getPlayerById = useCallback((id: number | string) => 
    teams.flatMap(t => t.roster).find(p => String(p.id) === String(id)), [teams]);

  const simulateMatchday = useCallback(() => {}, []);
  const resetLeagueData = () => {
    if (confirm("¿Borrar todo?")) {
      setTeams([]);
      setMatches([]);
      window.location.reload();
    }
  };

  return (
    <LeagueContext.Provider value={{
      teams,
      divisions,
      matches,
      players: teams.flatMap(t => t.roster),
      isLoaded,
      addTeam,
      deleteTeam,
      getTeamById,
      getPlayerById,
      simulateMatchday,
      resetLeagueData,
      importLeagueData,
      refreshData // <--- Exportamos esto para usarlo en el Dashboard
    } as any}>
      {children}
    </LeagueContext.Provider>
  );
};