"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, TeamOfTheWeekPlayer, MatchEvent } from "@/lib/types";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LeagueContext = createContext<LeagueContextType>({} as LeagueContextType);

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isGeneratingRef = useRef(false);

  const divisions: Division[] = [
    { id: 1, name: "Primera División" },
    { id: 2, name: "Segunda División" },
    { id: 3, name: "Tercera División" },
    { id: 4, name: "Cuarta División" }
  ];

  const refreshData = useCallback(async () => {
    try {
      const savedTeams = localStorage.getItem('league_active_teams');
      if (savedTeams) setTeams(JSON.parse(savedTeams));

      const [matchesRes, eventsRes] = await Promise.all([
        supabase.from('matches').select('*').order('round', { ascending: true }),
        supabase.from('match_events').select('*') 
      ]);

      if (matchesRes.data) setMatches(matchesRes.data);
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

  const processedTeams = useMemo(() => {
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, cleanSheets: 0 };
      const teamMatches = matches.filter(m => m.played && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)));

      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        const gFor = isHome ? Number(m.home_goals) : Number(m.away_goals);
        const gAg = isHome ? Number(m.away_goals) : Number(m.home_goals);
        stats.goalsFor += gFor;
        stats.goalsAgainst += gAg;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
        if (gAg === 0) stats.cleanSheets += 1;
      });

      const updatedRoster = (team.roster || []).map(player => {
        const playerEvents = matchEvents.filter(e => String(e.player_id) === String(player.id));
        return {
          ...player,
          stats: {
            ...player.stats,
            goals: playerEvents.filter(e => e.type === 'GOAL').length,
            assists: playerEvents.filter(e => e.type === 'ASSIST').length,
            cards: {
              yellow: playerEvents.filter(e => e.type === 'YELLOW_CARD').length,
              red: playerEvents.filter(e => e.type === 'RED_CARD').length,
            }
          },
          rating: player.rating + (playerEvents.filter(e => e.type === 'GOAL').length * 0.1)
        };
      });
      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents]);

  const getMatchEvents = useCallback((matchId: string | number) => {
    return matchEvents.filter(e => String(e.match_id) === String(matchId)).sort((a, b) => a.minute - b.minute);
  }, [matchEvents]);

  const getTeamOfTheWeek = useCallback((week: number): TeamOfTheWeekPlayer[] => {
    const players = processedTeams.flatMap(t => (t.roster || []).map(p => ({
      ...p, 
      teamName: t.name, 
      teamLogoUrl: t.badge_url,
      teamDataAiHint: t.real_team_name || t.name // Soluciona error de propiedad faltante
    })));
    return players.sort((a, b) => b.rating - a.rating).slice(0, 11);
  }, [processedTeams]);

  const getSeasonAwards = useCallback(() => {
    const allPlayers = processedTeams.flatMap(t => t.roster);
    // Soluciona error de compatibilidad 'null' vs 'Player | undefined'
    const emptyPlayer = undefined; 
    return {
      pichichi: [...allPlayers].sort((a, b) => b.stats.goals - a.stats.goals)[0] || emptyPlayer,
      assistMaster: [...allPlayers].sort((a, b) => b.stats.assists - a.stats.assists)[0] || emptyPlayer,
      bestGoalkeeper: [...allPlayers].filter(p => p.position === 'Goalkeeper').sort((a,b) => b.rating - a.rating)[0] || emptyPlayer
    };
  }, [processedTeams]);

  const drawTournament = useCallback(async (competitionName: "The Titan Peak" | "Colossus Shield"): Promise<void> => {
    // Implementación básica para cumplir con el tipo Promise<void>
    toast.info(`Iniciando sorteo de ${competitionName}`);
  }, []);

  const autoMatchmaker = useCallback(async () => {
    if (teams.length < 2 || !isLoaded || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    const matchesToInsert: any[] = [];
    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id);
      if (divTeams.length < 2) continue;
      const divMatches = matches.filter(m => Number(m.division_id) === div.id);
      const lastRound = divMatches.length > 0 ? Math.max(...divMatches.map(m => Number(m.round))) : 0;
      const pendingInLastRound = divMatches.filter(m => Number(m.round) === lastRound && !m.played);
      let targetRound = lastRound === 0 ? 1 : (pendingInLastRound.length === 0 ? lastRound + 1 : lastRound);
      const busyIds = new Set(divMatches.filter(m => Number(m.round) === targetRound).flatMap(m => [String(m.home_team), String(m.away_team)]));
      const availableTeams = divTeams.filter(t => !busyIds.has(String(t.id)));
      if (availableTeams.length >= 2) {
        const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length - 1; i += 2) {
          matchesToInsert.push({
            home_team: shuffled[i].id, away_team: shuffled[i+1].id,
            round: targetRound, played: false, division_id: div.id,
            competition: "League", home_goals: 0, away_goals: 0
          });
        }
      }
    }
    if (matchesToInsert.length > 0) {
      const { data, error } = await supabase.from('matches').insert(matchesToInsert).select();
      if (!error && data) setMatches(prev => [...prev, ...data]);
    }
    isGeneratingRef.current = false;
  }, [teams, matches, divisions, isLoaded]);

  useEffect(() => { if (isLoaded) autoMatchmaker(); }, [matches.length, teams.length, isLoaded, autoMatchmaker]);

  return (
    <LeagueContext.Provider value={{
      teams: processedTeams,
      divisions,
      matches,
      matchEvents,
      players: processedTeams.flatMap(t => t.roster || []),
      isLoaded,
      addTeam: (t) => setTeams(prev => [...prev, t]),
      deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))),
      updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)),
      addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...t.roster, p]} : t)),
      removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: t.roster.filter(p => String(p.id) !== String(pid))} : t)),
      getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)),
      getPlayerById: (id) => processedTeams.flatMap(t => t.roster).find(p => String(p.id) === String(id)),
      getTeamByPlayerId: (pid) => processedTeams.find(t => t.roster.some(p => String(p.id) === String(pid))),
      simulateMatchday: () => {}, 
      getMatchEvents,
      getTeamOfTheWeek,
      getBestEleven: (type) => getTeamOfTheWeek(1), 
      getLeagueQualifiers: (id) => ({ titanPeak: [], colossusShield: [] }),
      getSeasonAwards,
      drawTournament,
      resetLeagueData: () => { localStorage.clear(); window.location.reload(); },
      importLeagueData: (d: any) => true,
      refreshData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};