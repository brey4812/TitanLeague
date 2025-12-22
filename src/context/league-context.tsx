"use client";

import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Team, Division, MatchResult, Player, TeamOfTheWeekPlayer } from "@/lib/types";
import { initialTeams, initialDivisions, initialMatchResults } from "@/lib/data";
import { produce } from "immer";

interface LeagueContextType {
  teams: Team[];
  divisions: Division[];
  matches: MatchResult[];
  players: Player[];
  isLoaded: boolean;
  getTeamById: (id: number) => Team | undefined;
  getPlayerById: (id: number) => Player | undefined;
  getTeamByPlayerId: (playerId: number) => Team | undefined;
  simulateMatchday: () => void;
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: "week" | "month" | "season", weekValue?: number) => TeamOfTheWeekPlayer[];
  updateTeam: (updatedTeam: Team) => void;
  addTeam: (newTeam: Team) => void;
  resetLeagueData: () => void;
}

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    try {
      const savedTeams = localStorage.getItem('league_teams');
      const savedMatches = localStorage.getItem('league_matches');
      if (savedTeams && savedMatches) {
        const parsedTeams = JSON.parse(savedTeams);
        setTeams(parsedTeams);
        setMatches(JSON.parse(savedMatches));
        setPlayers(parsedTeams.flatMap((t: Team) => t.roster));
      } else {
        const allPlayers = initialTeams.flatMap(t => t.roster);
        setTeams(initialTeams);
        setMatches(initialMatchResults);
        setPlayers(allPlayers);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoaded(true); }
  }, []);

  // --- FUNCIONES DE BÚSQUEDA ---
  const getTeamById = useCallback((id: number) => teams.find(t => t.id === id), [teams]);
  const getPlayerById = useCallback((id: number) => players.find(p => p.id === id), [players]);
  const getTeamByPlayerId = useCallback((playerId: number) => 
    teams.find(team => team.roster.some(player => player.id === playerId)), [teams]);

  // --- LÓGICA DE 11 IDEAL ---
  const getBestEleven = useCallback((type: "week" | "month" | "season", weekValue: number = 1): TeamOfTheWeekPlayer[] => {
    if (!players.length) return [];
    
    // Seed para que el 11 no cambie al refrescar la página
    const seed = type === "week" ? weekValue : type === "month" ? Math.ceil(weekValue / 4) : 999;
    const mulberry32 = (a: number) => () => {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const rng = mulberry32(seed);

    const getTopByPos = (pos: string, count: number) => {
        return [...players]
            .filter(p => p.position === pos)
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, count);
    };

    const selected = [
        ...getTopByPos('Goalkeeper', 1),
        ...getTopByPos('Defender', 4),
        ...getTopByPos('Midfielder', 3),
        ...getTopByPos('Forward', 3)
    ];

    return selected.map(p => {
        const team = getTeamByPlayerId(p.id);
        return {
            ...p,
            teamName: team?.name || 'Unknown',
            teamLogoUrl: team?.logoUrl || '',
            teamDataAiHint: team?.dataAiHint || ''
        };
    });
  }, [players, getTeamByPlayerId]);

  const getTeamOfTheWeek = useCallback((week: number) => getBestEleven("week", week), [getBestEleven]);

  // --- MANTENIMIENTO LIGA ---
  const simulateMatchday = () => { /* Tu lógica de simulación aquí */ };
  const updateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };
  const addTeam = (newTeam: Team) => setTeams(prev => [...prev, newTeam]);
  const resetLeagueData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <LeagueContext.Provider value={{
      teams,
      divisions,
      matches,
      players,
      isLoaded,
      getTeamById,
      getPlayerById,
      getTeamByPlayerId,
      simulateMatchday,
      getTeamOfTheWeek,
      getBestEleven,
      updateTeam,
      addTeam,
      resetLeagueData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};