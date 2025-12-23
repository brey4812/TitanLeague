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
  // --- ESTADO INICIAL SIEMPRE VACÍO ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" }
  ];

  // --- CARGA DE DATOS ESTRICTA DESDE SUPABASE ---
  const refreshData = useCallback(async () => {
    try {
      // 1. Limpieza de posibles datos antiguos en el navegador para evitar los 70 equipos
      localStorage.removeItem('league_teams');
      localStorage.removeItem('league_matches');
      localStorage.removeItem('league-data');

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, roster:players(*)');
      
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      // Solo asignamos lo que viene de la base de datos real
      setTeams(teamsData || []);
      setMatches(matchesData || []);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Al montar, limpiamos el navegador y traemos solo lo de Supabase
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- LÓGICA: GENERACIÓN AUTOMÁTICA DE DUELOS ---
  const autoMatchmaker = useCallback(async () => {
    for (const div of divisions) {
      const readyTeams = teams.filter(t => 
        Number(t.division_id) === div.id && 
        (t.roster?.length || 0) >= 11
      );
      
      if (readyTeams.length >= 2) {
        const lastTeam = readyTeams[readyTeams.length - 1];
        const opponent = readyTeams[readyTeams.length - 2];

        const alreadyHasMatch = matches.some((m: any) => 
          m.home_team_id === lastTeam.id || m.away_team_id === lastTeam.id ||
          m.home_team_id === opponent.id || m.away_team_id === opponent.id
        );

        if (!alreadyHasMatch) {
          const { error } = await supabase.from('matches').insert({
            home_team_id: opponent.id,
            away_team_id: lastTeam.id,
            round: 1,
            played: false,
            division_id: div.id,
            competition: "League"
          });

          if (!error) {
            refreshData();
            toast.info(`Duelo generado: ${opponent.name} vs ${lastTeam.name}`);
          }
        }
      }
    }
  }, [teams, matches, refreshData, divisions]);

  useEffect(() => {
    if (isLoaded && teams.length >= 2) {
      autoMatchmaker();
    }
  }, [teams.length, isLoaded, autoMatchmaker]);


  // --- GESTIÓN DE EQUIPOS ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => {
      if (prev.find(t => String(t.id) === String(newTeam.id))) return prev;
      return [...prev, newTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    setMatches(prev => prev.filter(m => 
      String(m.home_team_id) !== String(id) && 
      String(m.away_team_id) !== String(id)
    ));
    toast.success("Equipo quitado de la lista");
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? updated : t));
  }, []);

  // --- GESTIÓN DE JUGADORES ---
  const addPlayerToTeam = useCallback((teamId: number | string, player: Player) => {
    setTeams(prev => prev.map(team => {
      if (String(team.id) === String(teamId)) {
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
    teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)), [teams]);

  const getTeamByPlayerId = useCallback((pid: number | string) => 
    teams.find(t => t.roster.some(p => String(p.id) === String(pid))), [teams]);

  const resetLeagueData = () => {
    if (confirm("¿Limpiar todos los datos del navegador?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

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
      importLeagueData: (d: any) => true,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};