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
      // 1. Recuperamos la selección de equipos del localStorage (Estado Local persistente)
      const savedTeams = localStorage.getItem('league_active_teams');
      if (savedTeams) {
        setTeams(JSON.parse(savedTeams));
      }

      // 2. Cargamos los partidos reales de la DB
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Guardar automáticamente la lista de equipos en localStorage cuando cambie
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

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
          String(m.home_team_id) === String(lastTeam.id) || 
          String(m.away_team_id) === String(lastTeam.id)
        );

        if (!alreadyHasMatch) {
          const { data, error } = await supabase.from('matches').insert({
            home_team_id: opponent.id,
            away_team_id: lastTeam.id,
            round: 1,
            played: false,
            division_id: div.id,
            competition: "League"
          }).select();

          if (!error && data) {
            setMatches(prev => [data[0], ...prev]);
            toast.info(`Duelo generado: ${opponent.name} vs ${lastTeam.name}`);
          }
        }
      }
    }
  }, [teams, matches, divisions]);

  useEffect(() => {
    if (isLoaded && teams.length >= 2) {
      autoMatchmaker();
    }
  }, [teams.length, isLoaded, autoMatchmaker]);


  // --- GESTIÓN DE EQUIPOS (SIN MODIFICAR LA DB) ---
  const addTeam = useCallback((newTeam: Team) => {
    // Añadimos al estado local sin hacer .update() en Supabase
    setTeams(prev => {
      if (prev.find(t => String(t.id) === String(newTeam.id))) {
        toast.error("El equipo ya está en tu liga");
        return prev;
      }
      toast.success(`${newTeam.name} añadido correctamente`);
      return [...prev, newTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    // Quitamos del estado local
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    
    // Filtramos partidos locales
    setMatches(prev => prev.filter(m => 
      String(m.home_team_id) !== String(id) && 
      String(m.away_team_id) !== String(id)
    ));
    toast.success("Equipo quitado de la liga");
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? updated : t));
  }, []);

  // --- GESTIÓN DE JUGADORES (MODO LOCAL) ---
  const addPlayerToTeam = useCallback((teamId: number | string, player: Player) => {
    setTeams(prev => prev.map(team => {
      if (String(team.id) === String(teamId)) {
        return { ...team, roster: [...(team.roster || []), player] };
      }
      return team;
    }));
  }, []);

  const removePlayerFromTeam = useCallback((teamId: number | string, playerId: number | string) => {
    setTeams(prev => prev.map(team => {
      if (String(team.id) === String(teamId)) {
        return { ...team, roster: (team.roster || []).filter(p => String(p.id) !== String(playerId)) };
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
    teams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))), [teams]);

  const resetLeagueData = () => {
    if (confirm("¿Limpiar liga activa? (No borrará la base de datos global)")) {
      setTeams([]);
      localStorage.removeItem('league_active_teams');
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