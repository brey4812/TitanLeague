"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Player, MatchResult, MatchEvent, TeamOfTheWeekPlayer, Division, LeagueContextType } from "@/lib/types";

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
    if (savedTeams) setTeams(JSON.parse(savedTeams));
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
    setTeams(prev => [...prev, { ...newTeam, roster: newTeam.roster || [] }]);
  }, []);

  const deleteTeam = useCallback((id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setMatches(prev => prev.filter(m => m.homeTeamId !== id && m.awayTeamId !== id));
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  // --- GESTIÓN DE JUGADORES (Límite 20) ---
  const addPlayerToTeam = useCallback((teamId: number, player: Player) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        if (team.roster.length >= 20) return team; // Bloqueo de límite
        return { ...team, roster: [...team.roster, player] };
      }
      return team;
    }));
  }, []);

  const removePlayerFromTeam = useCallback((teamId: number, playerId: number) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        return { ...team, roster: team.roster.filter(p => p.id !== playerId) };
      }
      return team;
    }));
  }, []);

  // --- BÚSQUEDAS ---
  const getTeamById = useCallback((id: number) => teams.find(t => t.id === id), [teams]);
  const getPlayerById = useCallback((id: number) => 
    teams.flatMap(t => t.roster).find(p => p.id === id), [teams]);
  const getTeamByPlayerId = useCallback((pid: number) => 
    teams.find(t => t.roster.some(p => p.id === pid)), [teams]);

  // --- SIMULACIÓN Y SANCIONES (2 Amarillas = Suspensión) ---
  const simulateMatchday = useCallback(() => {
    // Lógica para generar resultados y eventos detallados
    // Aquí se aplicarían las sanciones de la jornada anterior analizando MatchEvents
  }, [teams, matches]);

  const getBestEleven = useCallback((type: string, val?: number) => [] as TeamOfTheWeekPlayer[], []);
  const getTeamOfTheWeek = (week: number) => getBestEleven("week", week);

  const resetLeagueData = () => {
    localStorage.clear();
    window.location.reload();
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
      resetLeagueData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};