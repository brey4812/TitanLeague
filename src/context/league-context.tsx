"use client";

import { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Team, Player, MatchResult, Division, LeagueContextType, MatchEvent, TeamOfTheWeekPlayer } from "@/lib/types";
import { calculatePlayerRating } from "@/lib/calculatePlayerRating";
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
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);

  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('league_session_id');
      if (!id) {
        id = Math.random().toString(36).substring(7);
        localStorage.setItem('league_session_id', id);
      }
      return id;
    }
    return '';
  });

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
      
      const [matchesRes, eventsRes, seasonRes] = await Promise.all([
        supabase.from('matches')
          .select('*')
          .eq('session_id', sessionId)
          .order('matchday', { ascending: true }), 
        supabase.from('match_events').select('*').eq('session_id', sessionId),
        supabase.from('seasons').select('id, season_number').eq('is_active', true).maybeSingle()
      ]);

      if (seasonRes.data) {
        setCurrentSeason(Number(seasonRes.data.season_number) || 1);
        setCurrentSeasonId(Number(seasonRes.data.id));
      }
      
      if (matchesRes.data) {
        const normalized = matchesRes.data.map(m => ({
          ...m,
          round: m.matchday 
        }));
        setMatches(normalized);
      }
      
      if (eventsRes.data) setMatchEvents(eventsRes.data);
    } catch (error) {
      console.error("Error refreshData Titán:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (isLoaded && teams.length > 0) {
      localStorage.setItem('league_active_teams', JSON.stringify(teams));
    }
  }, [teams, isLoaded]);

  const applyPromotionsAndRelegations = useCallback((currentTeams: Team[]) => {
    const teamsByDiv: Record<number, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    currentTeams.forEach(t => { 
      if (teamsByDiv[t.division_id]) teamsByDiv[t.division_id].push(t); 
    });

    Object.keys(teamsByDiv).forEach(id => {
      teamsByDiv[Number(id)].sort((a, b) => (b.points || 0) - (a.points || 0));
    });

    const newTeams = [...currentTeams];
    const move = (teamId: any, newDiv: number) => {
      const idx = newTeams.findIndex(t => t.id === teamId);
      if (idx !== -1) newTeams[idx].division_id = newDiv;
    };

    if (teamsByDiv[1].length >= 4) teamsByDiv[1].slice(-2).forEach(t => move(t.id, 2));
    if (teamsByDiv[2].length >= 2) teamsByDiv[2].slice(0, 2).forEach(t => move(t.id, 1));
    if (teamsByDiv[2].length >= 6) teamsByDiv[2].slice(-2).forEach(t => move(t.id, 3));
    if (teamsByDiv[3].length >= 2) teamsByDiv[3].slice(0, 2).forEach(t => move(t.id, 2));
    if (teamsByDiv[3].length >= 6) teamsByDiv[3].slice(-2).forEach(t => move(t.id, 4));
    if (teamsByDiv[4].length >= 2) teamsByDiv[4].slice(0, 2).forEach(t => move(t.id, 3));

    return newTeams.map(team => ({
      ...team,
      points: 0,
      stats: { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      roster: (team.roster || []).map(player => ({
        ...player,
        rating: 6.0,
        stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
      }))
    }));
  }, []);

  const autoMatchmaker = useCallback(async () => {
    if (!isLoaded || teams.length < 2 || !sessionId || !currentSeasonId) return;

    for (const div of divisions) {
      const divTeams = teams.filter(t => Number(t.division_id) === div.id && (t.roster?.length || 0) >= 11);
      if (divTeams.length < 2) continue;

      const { data: existingMatches } = await supabase
        .from('matches')
        .select('home_team, away_team')
        .eq('division_id', div.id)
        .eq('season_id', currentSeasonId)
        .eq('session_id', sessionId);

      const existingTeamsIds = new Set(existingMatches?.flatMap(m => [String(m.home_team), String(m.away_team)]));
      const allTeamsRegistered = divTeams.every(t => existingTeamsIds.has(String(t.id)));
      
      if (allTeamsRegistered && existingMatches && existingMatches.length > 0) continue;

      await supabase
        .from('matches')
        .delete()
        .eq('division_id', div.id)
        .eq('season_id', currentSeasonId)
        .eq('session_id', sessionId)
        .eq('played', false);

      let scheduleTeams = [...divTeams];
      if (scheduleTeams.length % 2 !== 0) {
        scheduleTeams.push({ id: "FREE", name: "DESCANSO" } as any);
      }

      const n = scheduleTeams.length;
      const rounds = n - 1;
      const allMatches = [];

      for (let j = 0; j < rounds; j++) {
        for (let i = 0; i < n / 2; i++) {
          const home = scheduleTeams[i];
          const away = scheduleTeams[n - 1 - i];

          if (home.id !== "FREE" && away.id !== "FREE") {
            allMatches.push({
              home_team: Number(home.id),
              away_team: Number(away.id),
              matchday: j + 1,
              played: false,
              division_id: div.id,
              competition: "League",
              session_id: sessionId,
              season_id: currentSeasonId 
            });
            allMatches.push({
              home_team: Number(away.id),
              away_team: Number(home.id),
              matchday: j + 1 + rounds, 
              played: false,
              division_id: div.id,
              competition: "League",
              session_id: sessionId,
              season_id: currentSeasonId 
            });
          }
        }
        scheduleTeams.splice(1, 0, scheduleTeams.pop()!);
      }

      if (allMatches.length > 0) {
        const { data } = await supabase.from('matches').insert(allMatches).select();
        if (data) {
          const normalizedNew = data.map(m => ({ ...m, round: m.matchday }));
          setMatches(prev => {
            const filtered = prev.filter(m => m.division_id !== div.id || m.played);
            return [...filtered, ...normalizedNew];
          });
        }
      }
    }
  }, [teams, matches, isLoaded, sessionId, currentSeasonId, divisions]);

  useEffect(() => { 
    const timer = setTimeout(() => { if (isLoaded) autoMatchmaker(); }, 2000);
    return () => clearTimeout(timer);
  }, [teams.length, isLoaded, autoMatchmaker]);

  const isSeasonFinished = useMemo(() => {
    if (!isLoaded || matches.length === 0) return false;
    const leagueMatches = matches.filter(m => m.competition === "League" && Number(m.season_id) === currentSeasonId);
    if (leagueMatches.length === 0) return false;
    return leagueMatches.every(m => m.played === true);
  }, [matches, isLoaded, currentSeasonId]);

  const processedTeams = useMemo(() => {
    if (!isLoaded || teams.length === 0) return [];
    
    return teams.map(team => {
      const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      const teamMatches = matches.filter(m => m.played && Number(m.season_id) === currentSeasonId && (String(m.home_team) === String(team.id) || String(m.away_team) === String(team.id)));
      
      teamMatches.forEach(m => {
        const isHome = String(m.home_team) === String(team.id);
        const gFor = isHome ? Number(m.home_goals) : Number(m.away_goals);
        const gAg = isHome ? Number(m.away_goals) : Number(m.home_goals);
        stats.goalsFor += gFor;
        stats.goalsAgainst += gAg;
        if (gFor > gAg) { stats.wins += 1; stats.points += 3; }
        else if (gFor === gAg) { stats.draws += 1; stats.points += 1; }
        else { stats.losses += 1; }
      });

      const updatedRoster = (team.roster || []).map(player => {
        const playerStats = player.stats || { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 };
        const ratings: number[] = [];
        teamMatches.forEach(match => {
          const events = matchEvents.filter(e => String(e.match_id) === String(match.id));
          const isHome = String(match.home_team) === String(team.id);
          const cleanSheet = (isHome ? Number(match.away_goals) : Number(match.home_goals)) === 0;
          ratings.push(calculatePlayerRating(player, events, cleanSheet));
        });
        const pEvents = matchEvents.filter(e => String(e.player_id) === String(player.id));
        const pAssists = matchEvents.filter(e => e.type === 'ASSIST' && (String(e.player_id) === String(player.id) || (e as any).assist_name === player.name));
        return {
          ...player,
          rating: ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 6.0,
          stats: { ...playerStats, goals: pEvents.filter(e => e.type === 'GOAL').length, assists: pAssists.length }
        };
      });
      return { ...team, stats, points: stats.points, roster: updatedRoster };
    });
  }, [teams, matches, matchEvents, currentSeasonId, isLoaded]);

  const value: LeagueContextType = {
    teams: processedTeams,
    divisions,
    matches,
    matchEvents,
    players: processedTeams.flatMap(t => t.roster || []),
    isLoaded,
    sessionId,
    season: currentSeason,
    isSeasonFinished,
    nextSeason: async () => {
      if (currentSeason >= 10) { alert("Límite de 10 temporadas."); return; }
      const confirmMsg = isSeasonFinished ? "¿Iniciar nueva temporada?" : "¿Forzar cierre?";
      if (!confirm(confirmMsg)) return;
      
      const updatedTeams = applyPromotionsAndRelegations(processedTeams);
      setTeams(updatedTeams);
      localStorage.setItem('league_active_teams', JSON.stringify(updatedTeams));

      const { data: nextS } = await supabase.from('seasons').insert([{ season_number: currentSeason + 1, is_active: true }]).select().single();
      if (nextS) {
        await supabase.from('seasons').update({ is_active: false }).eq('id', currentSeasonId);
        setCurrentSeason(nextS.season_number);
        setCurrentSeasonId(nextS.id);
        setMatches([]);
        setMatchEvents([]);
        alert(`Temporada ${nextS.season_number} iniciada.`);
      }
    },
    addTeam: (t) => setTeams(prev => [...prev, t]),
    deleteTeam: (id) => setTeams(prev => prev.filter(t => String(t.id) !== String(id))),
    updateTeam: (u) => setTeams(prev => prev.map(t => String(t.id) === String(u.id) ? u : t)),
    addPlayerToTeam: (tid, p) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: [...(t.roster || []), p]} : t)),
    removePlayerFromTeam: (tid, pid) => setTeams(prev => prev.map(t => String(t.id) === String(tid) ? {...t, roster: (t.roster || []).filter(p => String(p.id) !== String(pid))} : t)),
    getTeamById: (id) => processedTeams.find(t => String(t.id) === String(id)),
    getPlayerById: (id) => processedTeams.flatMap(t => t.roster || []).find(p => String(p.id) === String(id)),
    getTeamByPlayerId: (pid) => processedTeams.find(t => (t.roster || []).some(p => String(p.id) === String(pid))),
    
    simulateMatchday: async () => {
      const nextMatch = matches.find(m => m.played === false);
      if (!nextMatch) return alert("No hay más jornadas.");

      // Forzamos la obtención del seasonId activo si currentSeasonId no está listo
      let seasonValue = currentSeasonId;
      if (!seasonValue) {
        const { data: activeSeason } = await supabase.from('seasons').select('id').eq('is_active', true).maybeSingle();
        if (activeSeason) seasonValue = activeSeason.id;
      }

      if (!seasonValue || !sessionId) {
        toast.error("Error: Sesión o Temporada no cargada correctamente.");
        return;
      }

      try {
        const res = await fetch("/api/match/simulate-matchday", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            divisionId: Number(nextMatch.division_id), 
            week: Number(nextMatch.round || nextMatch.matchday || 1), 
            sessionId: String(sessionId), 
            seasonId: Number(seasonValue) 
          }) 
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Fallo en el servidor");
        }

        await refreshData();
        toast.success("Jornada simulada.");
      } catch (err: any) {
        console.error("Error Sim:", err.message);
        toast.error(`Error: ${err.message}`);
      }
    },

    getMatchEvents: (id) => matchEvents
        .filter(e => String(e.match_id) === String(id))
        .map(e => ({ 
            ...e, 
            playerName: e.player_name || (e as any).playerName, 
            assistName: e.assist_name || (e as any).assistName 
        })),

    getTeamOfTheWeek: (w) => {
      const weekM = matches.filter(m => m.round === w && m.played);
      const candidates = processedTeams.flatMap(t => t.roster || []).filter(p => weekM.some(m => String(m.home_team) === String(p.team_id) || String(m.away_team) === String(p.team_id)));
      return candidates.sort((a,b) => b.rating - a.rating).slice(0, 11) as any;
    },
    
    getBestEleven: (t, v) => [],
    lastPlayedWeek: matches.filter(m => m.played).length === 0 ? 1 : Math.max(...matches.filter(m => m.played).map(m => Number(m.round || 0))),
    
    getLeagueQualifiers: (divId) => {
      const sorted = processedTeams.filter(t => t.division_id === divId).sort((a,b) => (b.points || 0) - (a.points || 0));
      return { titanPeak: sorted.slice(0, 4), colossusShield: sorted.slice(4, 8) };
    },
    
    getSeasonAwards: () => ({ pichichi: undefined, assistMaster: undefined, bestGoalkeeper: undefined }),
    drawTournament: async (n) => { console.log("Sorteando:", n); }, 

    resetLeagueData: async () => { 
      if(confirm("¿Resetear todos los datos de esta sesión?")) { 
        try {
          await supabase.from('match_events').delete().eq('session_id', sessionId);
          await supabase.from('matches').delete().eq('session_id', sessionId);
          localStorage.clear(); 
          window.location.reload(); 
        } catch (error) {
          console.error(error);
          toast.error("Error al limpiar base de datos.");
        }
      } 
    },
    importLeagueData: (newData) => { localStorage.setItem('league_active_teams', JSON.stringify(newData)); setTeams(newData); return true; },
    refreshData
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};