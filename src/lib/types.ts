/**
 * src/lib/types.ts
 */

export interface Player {
  id: number | string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  country?: string;
  face_url?: string;
  team_id?: number | string;
  rating: number;
  matchRatings?: { season: number; week: number; rating: number; }[];
  disciplinary?: { yellowAccumulated: number; suspendedUntilWeek?: number; };
  stats: { goals: number; assists: number; cleanSheets: number; cards: { yellow: number; red: number; }; mvp: number; };
}

export interface Team {
  id: number | string;
  name: string;
  country: string;
  logo?: string;
  badge_url?: string;
  real_team_name?: string;
  league?: string;
  external_id?: string;
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  division_id: number;
  divisionName?: string;
  stats?: { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; };
  roster: Player[];
  points?: number;
}

export interface Division { id: number; name: string; }

export interface MatchEvent {
  id?: number;
  match_id: number | string;
  player_id: number | string;
  team_id: number | string;
  type: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
  session_id?: string;
  // Sincronización con Supabase
  player_name?: string;
  assist_name?: string;
  player_out_name?: string;
  // Sincronización con UI
  playerName?: string;
  assistName?: string;
  playerOutName?: string;
}

export interface MatchResult {
  id: number | string;
  // season_id es clave para que no falle el insert
  season_id?: number | string; 
  season?: number;
  round?: number;
  week?: number;
  home_team: number | string;
  away_team: number | string;
  home_goals: number;
  away_goals: number;
  played: boolean;
  division_id: number;
  competition?: string;
  session_id?: string;
  mvpId?: number | string;
  events?: MatchEvent[];
}

export interface TeamOfTheWeekPlayer extends Player { teamName: string; teamLogoUrl?: string; teamDataAiHint?: string; }

export interface LeagueContextType {
  teams: Team[];
  divisions: Division[];
  matches: MatchResult[];
  matchEvents: MatchEvent[];
  players: Player[];
  isLoaded: boolean;
  sessionId: string;
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
  simulateMatchday: () => Promise<void>;
  getMatchEvents: (matchId: number | string) => MatchEvent[];
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: 'week' | 'month' | 'season', value?: number) => TeamOfTheWeekPlayer[];
  lastPlayedWeek: number;
  getLeagueQualifiers: (divisionId: number) => { titanPeak: Team[]; colossusShield: Team[]; };
  getSeasonAwards: () => { pichichi: Player | undefined; assistMaster: Player | undefined; bestGoalkeeper: Player | undefined; };
  drawTournament: (competitionName: 'The Titan Peak' | 'Colossus Shield') => Promise<void>;
  resetLeagueData: () => void;
  importLeagueData: (newData: any) => boolean;
  refreshData: () => Promise<void>;
}