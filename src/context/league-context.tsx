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

  // --- CARGA DE DATOS ---
  const refreshData = useCallback(async () => {
    try {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, roster:players(*)');
      
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsData) setTeams(teamsData);
      if (matchesData) setMatches(matchesData);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- GESTIÓN DE EQUIPOS ---
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

  // CORRECCIÓN: Ahora solo sale de la lista visual, NO borra de Supabase
  const deleteTeam = useCallback((id: number | string) => {
    // Filtramos localmente para que desaparezca de la vista actual
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    
    // También lo quitamos de los partidos que se muestran
    setMatches(prev => prev.filter(m => 
      String(m.home_team_id) !== String(id) && 
      String(m.away_team_id) !== String(id)
    ));
    
    toast.success("Equipo quitado de la lista");
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? {
      ...updated,
      badge_url: updated.badge_url || (updated as any).logo || '/placeholder-team.png',
      roster: updated.roster.slice(0, 20)
    } : t));
  }, []);

  // --- GESTIÓN DE JUGADORES ---
  const addPlayerToTeam = useCallback((teamId: number | string, player: Player) => {
    setTeams(prev => prev.map(team => {
      if (String(team.id) === String(teamId)) {
        if (team.roster.length >= 20) return team; 
        if (team.roster.some(p => String(p.id) === String(player.id))) return team;
        return { ...team, roster: [...team.roster, player] };
      }
      return team;
    }));
  }, []);

  const removePlayerFromTeam = useCallback((teamId: number | string, playerId: number | string) => {
    setTeams(prev => prev.map(team => {
      if (String(team.id) === String(teamId)) {
        return { ...team, roster: team.roster.filter(p => String(p.id) !== String(playerId)) };
      }
      return team;
    }));
  }, []);

  // --- BÚSQUEDAS Y UTILIDADES ---
  const getTeamById = useCallback((id: number | string) => 
    teams.find(t => String(t.id) === String(id)), [teams]);
  
  const getPlayerById = useCallback((id: number | string) => 
    teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)), [teams]);

  const getTeamByPlayerId = useCallback((pid: number | string) => 
    teams.find(t => t.roster.some(p => String(p.id) === String(pid))), [teams]);

  const resetLeagueData = () => {
    if (confirm("¿Borrar todos los datos de la vista?")) {
      setTeams([]);
      setMatches([]);
      // Nota: reload() volverá a traer los datos de la DB al reiniciar
    }
  };

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

  return (
    <LeagueContext.Provider value={{
      teams,
      divisions,
      matches,
      players: teams.flatMap(t => t.roster || []),
      isLoaded,
      addTeam,
      deleteTeam,
      updateTeam,
      addPlayerToTeam,
      removePlayerFromTeam,
      getTeamById,
      getPlayerById,
      getTeamByPlayerId,
      simulateMatchday: () => {},
      getTeamOfTheWeek: (week: number) => [],
      getBestEleven: (type: string, val?: number) => [],
      resetLeagueData,
      importLeagueData,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};