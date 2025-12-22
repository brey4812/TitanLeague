"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Player, MatchResult, MatchEvent, TeamOfTheWeekPlayer, Division, LeagueContextType } from "@/lib/types";
import { produce } from "immer";

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

  // --- CARGA Y PERSISTENCIA ---
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

  // --- ACCIONES DE EQUIPO ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => {
      if (prev.find(t => t.id === newTeam.id)) return prev;
      return [...prev, newTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setMatches(prev => prev.filter(m => m.homeTeamId !== id && m.awayTeamId !== id));
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  // --- BÚSQUEDAS ---
  const getTeamById = (id: number) => teams.find(t => t.id === id);
  const getPlayerById = (id: number) => teams.flatMap(t => t.roster).find(p => p.id === id);
  const getTeamByPlayerId = (pid: number) => teams.find(t => t.roster.some(p => p.id === pid));

  // --- SIMULACIÓN Y SANCIONES ---
  const simulateMatchday = useCallback(() => {
    setMatches(currentMatches => {
      const nextWeek = currentMatches.length > 0 ? Math.max(...currentMatches.map(m => m.week)) + 1 : 1;
      
      // Lógica de Sanciones: Jugadores que se pierden esta jornada
      const suspendedPlayerIds = new Set<number>();
      
      // Buscamos en la jornada anterior (nextWeek - 1)
      const lastWeekMatches = currentMatches.filter(m => m.week === nextWeek - 1);
      lastWeekMatches.forEach(m => {
        m.events?.forEach(e => {
          if (e.type === 'red') suspendedPlayerIds.add(e.playerId);
          
          // Sanción por 2 amarillas en el mismo partido
          const yellowCardsInMatch = m.events?.filter(ev => ev.playerId === e.playerId && ev.type === 'yellow');
          if (yellowCardsInMatch && yellowCardsInMatch.length >= 2) {
            suspendedPlayerIds.add(e.playerId);
          }
        });
      });

      // Simulación básica de ejemplo para generar eventos
      const newMatches: MatchResult[] = [];
      // Aquí iterarías sobre tus enfrentamientos...
      
      return [...currentMatches, ...newMatches];
    });
  }, [teams]);

  // --- ESTADÍSTICAS IDEALES ---
  const getBestEleven = useCallback((type: string, val?: number): TeamOfTheWeekPlayer[] => {
    return []; // Implementar lógica de filtrado por rating y posición
  }, []);

  const getTeamOfTheWeek = (week: number) => getBestEleven("week", week);

  const resetLeagueData = () => {
    localStorage.removeItem('league_teams');
    localStorage.removeItem('league_matches');
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