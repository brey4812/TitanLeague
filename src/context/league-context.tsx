
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
  updateTeam: (updatedTeam: Team) => void;
  addTeam: (newTeam: Team) => void;
  resetLeagueData: () => void;
}

export const LeagueContext = createContext<LeagueContextType>({
  teams: [],
  divisions: [],
  matches: [],
  players: [],
  isLoaded: false,
  getTeamById: () => undefined,
  getPlayerById: () => undefined,
  getTeamByPlayerId: () => undefined,
  simulateMatchday: () => {},
  getTeamOfTheWeek: () => [],
  updateTeam: () => {},
  addTeam: () => {},
  resetLeagueData: () => {},
});

const getRandomPlayer = (team: Team): Player | null => {
    if (!team || !team.roster || team.roster.length === 0) return null;
    const roster = team.roster;
    return roster[Math.floor(Math.random() * roster.length)];
}

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedTeams = localStorage.getItem('league_teams');
      const savedDivisions = localStorage.getItem('league_divisions');
      const savedMatches = localStorage.getItem('league_matches');
      const savedPlayers = localStorage.getItem('league_players');

      if (savedTeams && savedDivisions && savedMatches && savedPlayers) {
        setTeams(JSON.parse(savedTeams));
        setDivisions(JSON.parse(savedDivisions));
        setMatches(JSON.parse(savedMatches));
        setPlayers(JSON.parse(savedPlayers));
      } else {
        // No saved data, initialize with default
        const allPlayers = initialTeams.flatMap(t => t.roster);
        setTeams(JSON.parse(JSON.stringify(initialTeams)));
        setDivisions(() => {
          const divs = JSON.parse(JSON.stringify(initialDivisions));
          divs.forEach((div: Division) => {
            div.teams = initialTeams.filter(t => t.division === div.id);
          });
          return divs;
        });
        setMatches(initialMatchResults);
        setPlayers(allPlayers);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      // Fallback to initial data if parsing fails
      const allPlayers = initialTeams.flatMap(t => t.roster);
      setTeams(JSON.parse(JSON.stringify(initialTeams)));
      setDivisions(() => {
          const divs = JSON.parse(JSON.stringify(initialDivisions));
          divs.forEach((div: Division) => {
            div.teams = initialTeams.filter(t => t.division === div.id);
          });
          return divs;
        });
      setMatches(initialMatchResults);
      setPlayers(allPlayers);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('league_teams', JSON.stringify(teams));
        localStorage.setItem('league_divisions', JSON.stringify(divisions));
        localStorage.setItem('league_matches', JSON.stringify(matches));
        localStorage.setItem('league_players', JSON.stringify(players));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [teams, divisions, matches, players, isLoaded]);
  
  const resetLeagueData = () => {
    localStorage.removeItem('league_teams');
    localStorage.removeItem('league_divisions');
    localStorage.removeItem('league_matches');
    localStorage.removeItem('league_players');

    const allPlayers = initialTeams.flatMap(t => t.roster);
    setTeams(JSON.parse(JSON.stringify(initialTeams)));
    setDivisions(() => {
      const divs = JSON.parse(JSON.stringify(initialDivisions));
      divs.forEach((div: Division) => {
        div.teams = initialTeams.filter(t => t.division === div.id);
      });
      return divs;
    });
    setMatches(initialMatchResults);
    setPlayers(allPlayers);
  };


  const getTeamById = useCallback((id: number) => {
    return teams.find(t => t.id === id);
  }, [teams]);

  const getPlayerById = useCallback((id: number) => {
    return players.find(p => p.id === id);
  }, [players]);
  
  const getTeamByPlayerId = useCallback((playerId: number) => {
    return teams.find(team => team.roster.some(player => player.id === playerId));
  }, [teams]);


  const updateTeam = (updatedTeam: Team) => {
    const allPlayers = teams.flatMap(t => t.roster);
    setPlayers(allPlayers);
    setTeams(currentTeams => currentTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    setDivisions(produce((draft: Division[]) => {
        draft.forEach(division => {
            const teamIndex = division.teams.findIndex(t => t.id === updatedTeam.id);
            if (teamIndex !== -1) {
                // If team is in this division
                if (division.id === updatedTeam.division) {
                    // Just update it
                    division.teams[teamIndex] = updatedTeam;
                } else {
                    // It moved divisions, remove from here
                    division.teams.splice(teamIndex, 1);
                }
            } else if (division.id === updatedTeam.division) {
                // It moved into this division, add it
                division.teams.push(updatedTeam);
            }
        });
    }));
  };

  const addTeam = (newTeam: Team) => {
    const newTeamWithId = { ...newTeam, id: Math.max(0, ...teams.map(t => t.id)) + 1 };
    setTeams(currentTeams => [...currentTeams, newTeamWithId]);
     setDivisions(produce((draft: Division[]) => {
        const division = draft.find(d => d.id === newTeamWithId.division);
        if (division) {
            division.teams.push(newTeamWithId);
        }
    }));
  };


  const simulateMatchday = () => {
    const newMatches: MatchResult[] = [];
    const maxWeek = matches.reduce((max, m) => Math.max(max, m.week), 0);
    const newWeek = maxWeek + 1;
    const latestId = matches.reduce((max, m) => Math.max(max, m.id), 0);
    let matchCounter = 0;

    const updatedTeams = produce(teams, draftTeams => {
        divisions.forEach(division => {
            const teamsInDivision = [...division.teams];
            
            // Simple round-robin pairing for simulation
            for (let i = 0; i < teamsInDivision.length; i += 2) {
                if (i + 1 >= teamsInDivision.length) continue;

                const homeTeam = teamsInDivision[i];
                const awayTeam = teamsInDivision[i+1];

                const homeScore = Math.floor(Math.random() * 5);
                const awayScore = Math.floor(Math.random() * 5);
                
                let mvpPlayer: Player | null = null;
                
                const homeTeamForMvp = getTeamById(homeTeam.id);
                const awayTeamForMvp = getTeamById(awayTeam.id);

                if (homeScore > awayScore && homeTeamForMvp) {
                    mvpPlayer = getRandomPlayer(homeTeamForMvp);
                } else if (awayScore > homeScore && awayTeamForMvp) {
                    mvpPlayer = getRandomPlayer(awayTeamForMvp);
                } else {
                    const coinToss = Math.random() > 0.5;
                    if(coinToss && homeTeamForMvp) mvpPlayer = getRandomPlayer(homeTeamForMvp);
                    else if (awayTeamForMvp) mvpPlayer = getRandomPlayer(awayTeamForMvp);
                }
                
                newMatches.push({
                    id: latestId + matchCounter + 1,
                    season: 1,
                    week: newWeek,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    homeScore: homeScore,
                    awayScore: awayScore,
                    isImportant: Math.random() > 0.7,
                    mvpId: mvpPlayer?.id,
                });
                matchCounter++;

                const homeTeamInDraft = draftTeams.find(t => t.id === homeTeam.id)!;
                const awayTeamInDraft = draftTeams.find(t => t.id === awayTeam.id)!;
                
                homeTeamInDraft.stats.goalsFor += homeScore;
                homeTeamInDraft.stats.goalsAgainst += awayScore;
                awayTeamInDraft.stats.goalsFor += awayScore;
                awayTeamInDraft.stats.goalsAgainst += homeScore;

                if (homeScore > awayScore) {
                    homeTeamInDraft.stats.wins++;
                    awayTeamInDraft.stats.losses++;
                } else if (awayScore > homeScore) {
                    awayTeamInDraft.stats.wins++;
                    homeTeamInDraft.stats.losses++;
                } else {
                    homeTeamInDraft.stats.draws++;
                    awayTeamInDraft.stats.draws++;
                }
            }
        });
    });

    setTeams(updatedTeams);
    setMatches(prevMatches => [...prevMatches, ...newMatches]);

    // Update divisions with new team stats
    setDivisions(produce((draft: Division[]) => {
        draft.forEach(division => {
            division.teams = updatedTeams.filter(t => t.division === division.id);
        });
    }));
  };
  
    const getTeamOfTheWeek = useCallback((week: number): TeamOfTheWeekPlayer[] => {
        if (!players.length) return [];
        
        // seeded random number generator
        const mulberry32 = (a: number) => {
            return () => {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        }
        
        const rng = mulberry32(week); // Use week as seed for deterministic results

        const shuffle = (array: Player[]) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        const goalkeepers = shuffle(players.filter(p => p.position === 'Goalkeeper'));
        const defenders = shuffle(players.filter(p => p.position === 'Defender'));
        const midfielders = shuffle(players.filter(p => p.position === 'Midfielder'));
        const forwards = shuffle(players.filter(p => p.position === 'Forward'));

        const totwPlayers = [
            ...goalkeepers.slice(0, 1),
            ...defenders.slice(0, 4),
            ...midfielders.slice(0, 3),
            ...forwards.slice(0, 3)
        ];
        
        return totwPlayers.map(player => {
            const team = getTeamByPlayerId(player.id);
            return {
                ...player,
                teamName: team?.name || 'Unknown',
                teamLogoUrl: team?.logoUrl || '',
                teamDataAiHint: team?.dataAiHint || '',
            }
        })
    }, [players, getTeamByPlayerId]);

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
      updateTeam,
      addTeam,
      resetLeagueData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};
