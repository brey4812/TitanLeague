"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Player, MatchResult, TeamOfTheWeekPlayer, Division, LeagueContextType } from "@/lib/types";

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Divisiones estáticas de la liga
  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" }
  ];

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

  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => [...prev, newTeam]);
  }, []);

  const deleteTeam = useCallback((id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setMatches(prev => prev.filter(m => m.homeTeamId !== id && m.awayTeamId !== id));
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const getTeamById = (id: number) => teams.find(t => t.id === id);
  const getTeamByPlayerId = (pid: number) => teams.find(t => t.roster.some(p => p.id === pid));

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
      getTeamByPlayerId,
      getTeamOfTheWeek: () => [],
      getBestEleven: () => [],
      simulateMatchday: () => {},
      resetLeagueData: () => {
        localStorage.clear();
        window.location.reload();
      }
    }}>
      {children}
    </LeagueContext.Provider>
  );
};