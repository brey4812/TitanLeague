"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType } from "@/lib/types";

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
      const { data: teamsData } = await supabase.from('teams').select('*, roster:players(*)');
      const { data: matchesData } = await supabase.from('matches').select('*').order('created_at', { ascending: false });

      if (teamsData) setTeams(teamsData);
      if (matchesData) setMatches(matchesData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // --- LÓGICA DE GENERACIÓN AUTOMÁTICA ---
  const autoMatchmaker = useCallback(async () => {
    // Agrupamos equipos por división
    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id);
      
      // Si hay un número par de equipos, verificamos si el último necesita pareja
      if (divTeams.length > 0 && divTeams.length % 2 === 0) {
        const lastTeam = divTeams[divTeams.length - 1];
        
        // Verificamos si este equipo ya tiene un partido creado
        const hasMatch = matches.some((m: any) => 
          m.home_team_id === lastTeam.id || m.away_team_id === lastTeam.id
        );

        if (!hasMatch) {
          // Buscamos al penúltimo equipo de la misma división para emparejar
          const opponent = divTeams[divTeams.length - 2];
          
          await supabase.from('matches').insert({
            home_team_id: opponent.id,
            away_team_id: lastTeam.id,
            round: 1,
            played: false,
            division_id: div.id
          });
          refreshData();
        }
      }
    }
  }, [teams, matches, refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Ejecutar el emparejador cuando cambian los equipos
  useEffect(() => {
    if (isLoaded) autoMatchmaker();
  }, [teams.length, isLoaded, autoMatchmaker]);

  const getTeamById = useCallback((id: number | string) => 
    teams.find(t => String(t.id) === String(id)), [teams]);

  const getPlayerById = useCallback((id: number | string) => 
    teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)), [teams]);

  const resetLeagueData = async () => {
    if (confirm("¿Borrar todos los partidos y empezar de cero?")) {
      await supabase.from('matches').delete().neq('id', 0);
      refreshData();
    }
  };

  return (
    <LeagueContext.Provider value={{
      teams,
      divisions,
      matches,
      players: teams.flatMap(t => t.roster || []),
      isLoaded,
      getTeamById,
      getPlayerById,
      refreshData,
      resetLeagueData,
      importLeagueData: (d: any) => true,
      addTeam: (t: any) => {},
      deleteTeam: (id: any) => {},
      updateTeam: (t: any) => {},
      addPlayerToTeam: (id: any, p: any) => {},
      removePlayerFromTeam: (id: any, pid: any) => {},
      simulateMatchday: () => {},
      getTeamOfTheWeek: (w: any) => [],
      getBestEleven: (t: any) => [],
      getTeamByPlayerId: (id: any) => undefined,
    } as any}>
      {children}
    </LeagueContext.Provider>
  );
};