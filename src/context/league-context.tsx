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

  // --- CARGA DE DATOS FILTRADA ---
  const refreshData = useCallback(async () => {
    try {
      localStorage.removeItem('league_teams');
      localStorage.removeItem('league-data');

      // CLAVE: Solo traemos los equipos que el usuario "activó" para su liga
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, roster:players(*)')
        .eq('is_active', true); // Asegúrate de tener esta columna en Supabase
      
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      setTeams(teamsData || []);
      setMatches(matchesData || []);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

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


  // --- GESTIÓN DE EQUIPOS (MODO SELECTOR) ---
  const addTeam = useCallback(async (newTeam: Team) => {
    try {
      // En lugar de solo añadirlo al estado, lo marcamos como activo en la DB
      const { error } = await supabase
        .from('teams')
        .update({ is_active: true })
        .eq('id', newTeam.id);

      if (error) throw error;

      setTeams(prev => {
        if (prev.find(t => String(t.id) === String(newTeam.id))) return prev;
        return [...prev, newTeam];
      });
      toast.success(`${newTeam.name} añadido a la liga`);
    } catch (e) {
      toast.error("Error al activar equipo");
    }
  }, []);

  const deleteTeam = useCallback(async (id: number | string) => {
    try {
      // NO borramos de la DB, solo lo desactivamos de la liga
      await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', id);

      setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
      setMatches(prev => prev.filter(m => 
        String(m.home_team_id) !== String(id) && 
        String(m.away_team_id) !== String(id)
      ));
      toast.success("Equipo quitado de la liga (permanece en la DB)");
    } catch (e) {
      toast.error("Error al quitar equipo");
    }
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? updated : t));
  }, []);

  // --- GESTIÓN DE JUGADORES (SIN CAMBIOS) ---
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
    if (confirm("¿Limpiar vista actual?")) {
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