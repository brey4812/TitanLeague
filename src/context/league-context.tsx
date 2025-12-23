"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Player, MatchResult, TeamOfTheWeekPlayer, Division, LeagueContextType } from "@/lib/types";

// Asegúrate de que LeagueContextType incluya: importLeagueData: (data: any) => void;
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

  // --- PERSISTENCIA ---
  useEffect(() => {
    const savedTeams = localStorage.getItem('league_teams');
    const savedMatches = localStorage.getItem('league_matches');
    
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    } else {
      setTeams([]); 
    }
    
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('league_teams', JSON.stringify(teams));
      localStorage.setItem('league_matches', JSON.stringify(matches));
    }
  }, [teams, matches, isLoaded]);

  // --- GESTIÓN DE EQUIPOS ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => {
      if (prev.find(t => String(t.id) === String(newTeam.id))) return prev;
      
      const formattedTeam = {
        ...newTeam,
        badge_url: newTeam.badge_url || (newTeam as any).logo || '/placeholder-team.png',
        logo: newTeam.badge_url || (newTeam as any).logo || '/placeholder-team.png',
        roster: (newTeam.roster || []).slice(0, 20)
      };
      return [...prev, formattedTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    setMatches(prev => prev.filter(m => String(m.homeTeamId) !== String(id) && String(m.awayTeamId) !== String(id)));
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? {
      ...updated,
      badge_url: updated.badge_url || (updated as any).logo || '/placeholder-team.png',
      logo: updated.badge_url || (updated as any).logo || '/placeholder-team.png',
      roster: updated.roster.slice(0, 20)
    } : t));
  }, []);

  // --- NUEVO: IMPORTAR DATOS ---
  const importLeagueData = useCallback((newData: any) => {
    try {
      if (!newData.teams) throw new Error("Formato inválido");

      const formattedTeams = newData.teams.map((t: any) => ({
        ...t,
        badge_url: t.badge_url || t.logo || '/placeholder-team.png',
        logo: t.badge_url || t.logo || '/placeholder-team.png',
        roster: (t.roster || []).slice(0, 20)
      }));

      setTeams(formattedTeams);
      setMatches(newData.matches || []);
      
      // Feedback visual se maneja en el componente (Toast)
      return true;
    } catch (error) {
      console.error("Error importando:", error);
      return false;
    }
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

  // --- BÚSQUEDAS ---
  const getTeamById = useCallback((id: number | string) => 
    teams.find(t => String(t.id) === String(id)), [teams]);
  
  const getPlayerById = useCallback((id: number | string) => 
    teams.flatMap(t => t.roster).find(p => String(p.id) === String(id)), [teams]);

  const getTeamByPlayerId = useCallback((pid: number | string) => 
    teams.find(t => t.roster.some(p => String(p.id) === String(pid))), [teams]);

  const simulateMatchday = useCallback(() => {}, [teams, matches]);
  const getBestEleven = useCallback((type: string, val?: number) => [] as TeamOfTheWeekPlayer[], []);
  const getTeamOfTheWeek = (week: number) => getBestEleven("week", week);

  const resetLeagueData = () => {
    if (confirm("¿Seguro que quieres borrar todos los datos de la liga?")) {
      localStorage.removeItem('league_teams');
      localStorage.removeItem('league_matches');
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
      updateTeam,
      addPlayerToTeam,
      removePlayerFromTeam,
      getTeamById,
      getPlayerById,
      getTeamByPlayerId,
      simulateMatchday,
      getTeamOfTheWeek,
      getBestEleven,
      resetLeagueData,
      importLeagueData // <--- Añadido aquí
    }}>
      {children}
    </LeagueContext.Provider>
  );
};