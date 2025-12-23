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
      const savedTeams = localStorage.getItem('league_active_teams');
      if (savedTeams) {
        setTeams(JSON.parse(savedTeams));
      }

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

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

  // --- LÓGICA CORREGIDA: GENERACIÓN DE DUELOS (Nombres de columna home_team y away_team) ---
  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2) return;

    for (const div of divisions) {
      const readyTeams = teams.filter(t => 
        Number(t.division_id) === div.id && 
        (t.roster?.length || 0) >= 11
      );
      
      if (readyTeams.length >= 2) {
        const teamA = readyTeams[readyTeams.length - 2];
        const teamB = readyTeams[readyTeams.length - 1];

        // CORRECCIÓN: Usamos 'home_team' y 'away_team' según tu base de datos
        const alreadyMatched = matches.some((m: any) => 
          (String(m.home_team) === String(teamA.id) && String(m.away_team) === String(teamB.id)) ||
          (String(m.home_team) === String(teamB.id) && String(m.away_team) === String(teamA.id))
        );

        if (!alreadyMatched) {
          console.log(`Generando duelo: ${teamA.name} vs ${teamB.name}`);
          
          // CORRECCIÓN: Mapeo exacto a las columnas de Supabase
          const { data, error } = await supabase.from('matches').insert({
            home_team: teamA.id, 
            away_team: teamB.id,
            round: 1,
            played: false,
            division_id: div.id,
            competition: "League",
            home_goals: 0,
            away_goals: 0
          }).select();

          if (!error && data) {
            setMatches(prev => [data[0], ...prev]);
            toast.success(`Duelo generado: ${teamA.name} vs ${teamB.name}`);
          } else if (error) {
            console.error("Error Supabase:", error);
          }
        }
      }
    }
  }, [teams, matches, divisions]);

  useEffect(() => {
    if (isLoaded) {
      autoMatchmaker();
    }
  }, [teams, matches.length, isLoaded, autoMatchmaker]);

  // --- GESTIÓN DE EQUIPOS ---
  const addTeam = useCallback((newTeam: Team) => {
    setTeams(prev => {
      if (prev.find(t => String(t.id) === String(newTeam.id))) return prev;
      return [...prev, newTeam];
    });
  }, []);

  const deleteTeam = useCallback((id: number | string) => {
    setTeams(prev => prev.filter(t => String(t.id) !== String(id)));
    // CORRECCIÓN: Filtro de partidos usando nombres de columna correctos
    setMatches(prev => prev.filter(m => 
      String(m.home_team) !== String(id) && 
      String(m.away_team) !== String(id)
    ));
    toast.success("Equipo quitado de la liga");
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setTeams(prev => prev.map(t => String(t.id) === String(updated.id) ? updated : t));
  }, []);

  // --- GESTIÓN DE JUGADORES ---
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

  const getTeamById = useCallback((id: number | string) => 
    teams.find(t => String(t.id) === String(id)), [teams]);
  
  const getPlayerById = useCallback((id: number | string) => 
    teams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)), [teams]);

  const getTeamByPlayerId = useCallback((pid: number | string) => 
    teams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))), [teams]);

  const resetLeagueData = () => {
    if (confirm("¿Limpiar liga activa?")) {
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