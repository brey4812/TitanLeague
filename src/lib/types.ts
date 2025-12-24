/**
 * src/lib/types.ts
 */

export interface Player {
  id: number | string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  country?: string; 
  face_url?: string; 
  rating: number;
  team_id?: number | string; 
  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    cards: { yellow: number; red: number };
    mvp: number;
  };
}

export interface Team {
  id: number | string;
  name: string;
  country: string;
  logo?: string;
  badge_url: string;
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  real_team_name: string;
  league: string;
  external_id: string;
  division_id: number;
  divisionName?: string;
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  roster: Player[];
  points?: number; 
}

export interface Division {
  id: number;
  name: string;
}

export interface MatchEvent {
  id: number;
  match_id: number | string;
  player_id: number | string;
  team_id: number | string; 
  playerName?: string;
  player_name?: string; 
  assistName?: string; 
  assist_name?: string;
  playerOutName?: string;
  player_out_name?: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'ASSIST' | 'SUBSTITUTION';
  minute: number;
  session_id?: string; 
}

export interface MatchResult {
  id: number | string;
  season?: number; // Propiedad necesaria para el sistema de temporadas
  week: number;
  home_team: number | string;
  away_team: number | string;
  home_goals: number;
  away_goals: number;
  round?: number; 
  played: boolean; 
  division_id: number;
  competition?: string; 
  session_id?: string; 
  homeTeamId?: number | string;
  awayTeamId?: number | string;
  homeScore?: number;
  awayScore?: number;
  isImportant?: boolean;
  mvpId?: number | string;
  events?: MatchEvent[];
}

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl: string;
  teamDataAiHint: string;
}

export interface LeagueContextType {
  teams: Team[];
  divisions: Division[];
  matches: MatchResult[];
  matchEvents: MatchEvent[];
  players: Player[];
  isLoaded: boolean;
  sessionId: string; 
  
  // PROPIEDADES DE TEMPORADA
  season: number; 
  nextSeason: () => void;

  addTeam: (team: Team) => void;
  deleteTeam: (id: number | string) => void;
  updateTeam: (team: Team) => void;
  addPlayerToTeam: (teamId: number | string, player: Player) => void;
  removePlayerFromTeam: (teamId: number | string, playerId: number | string) => void;
  getTeamById: (id: number | string) => Team | undefined;
  getPlayerById: (id: number | string) => Player | undefined;
  getTeamByPlayerId: (playerId: number | string) => Team | undefined;
  simulateMatchday: () => void;
  getMatchEvents: (matchId: string | number) => MatchEvent[];
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  
  // MODIFICADO: Soporte para 'week', 'month', 'season'
  getBestEleven: (type: string, val?: number) => TeamOfTheWeekPlayer[];
  
  lastPlayedWeek: number; 
  
  getLeagueQualifiers: (divisionId: number) => { titanPeak: Team[], colossusShield: Team[] };
  getSeasonAwards: () => { pichichi: Player | undefined, assistMaster: Player | undefined, bestGoalkeeper: Player | undefined };
  drawTournament: (competitionName: "The Titan Peak" | "Colossus Shield") => Promise<void>;
  
  resetLeagueData: () => void;
  importLeagueData: (newData: any) => boolean;
  refreshData: () => Promise<void>;
}