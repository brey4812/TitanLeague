"use client";
import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Player, MatchResult, TeamOfTheWeekPlayer, Division } from "@/lib/types";

interface LeagueContextType {
  teams: Team[];
  divisions: any[];
  matches: MatchResult[];
  players: Player[];
  isLoaded: boolean;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: number) => void;
  getTeamById: (id: number) => Team | undefined;
  getTeamByPlayerId: (id: number) => Team | undefined;
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: any, val?: any) => TeamOfTheWeekPlayer[];
  simulateMatchday: () => void;
  resetLeagueData: () => void;
}

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar desde LocalStorage (o empezar vacío)
  useEffect(() => {
    const savedTeams = localStorage.getItem('league_teams');
    const savedMatches = localStorage.getItem('league_matches');
    if (savedTeams) setTeams(JSON.parse(savedTeams));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    setIsLoaded(true);
  }, []);

  // Guardar cambios automáticamente
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('league_teams', JSON.stringify(teams));
      localStorage.setItem('league_matches', JSON.stringify(matches));
    }
  }, [teams, matches, isLoaded]);

  const addTeam = (newTeam: Team) => {
    setTeams(prev => [...prev, { ...newTeam, id: Date.now() }]);
  };

  const updateTeam = (updated: Team) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTeam = (id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setMatches(prev => prev.filter(m => m.homeTeamId !== id && m.awayTeamId !== id));
  };

  // Funciones auxiliares necesarias para el tipado
  const getTeamById = (id: number) => teams.find(t => t.id === id);
  const getTeamByPlayerId = (pid: number) => teams.find(t => t.roster.some(p => p.id === pid));
  
  return (
    <LeagueContext.Provider value={{
      teams,
      matches,
      isLoaded,
      addTeam,
      updateTeam,
      deleteTeam,
      getTeamById,
      getTeamByPlayerId,
      divisions: [
        {id: 1, name: "Primera División"},
        {id: 2, name: "Segunda División"},
        {id: 3, name: "Tercera División"},
        {id: 4, name: "Cuarta División"}
      ],
      players: teams.flatMap(t => t.roster),
      getTeamOfTheWeek: () => [],
      getBestEleven: () => [],
      simulateMatchday: () => {},
      resetLeagueData: () => { localStorage.clear(); window.location.reload(); }
    }}>
      {children}
    </LeagueContext.Provider>
  );
};