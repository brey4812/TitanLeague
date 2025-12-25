/**
 * src/lib/types.ts
 */

/* ===================== PLAYER ===================== */

export interface Player {
  id: number | string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  country?: string;
  face_url?: string;

  team_id?: number | string;

  /** ⭐ MEDIA ACTUAL (calculada) */
  rating: number;

  /** ⭐ HISTORIAL DE VALORACIONES */
  matchRatings?: {
    season: number;
    week: number;
    rating: number; // 1–10
  }[];

  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    cards: {
      yellow: number;
      red: number;
    };
    mvp: number;
  };
}

/* ===================== TEAM ===================== */

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

  stats?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };

  roster: Player[];

  points?: number;
}

/* ===================== DIVISION ===================== */

export interface Division {
  id: number;
  name: string;
}

/* ===================== MATCH EVENTS ===================== */

export interface MatchEvent {
  id?: number;
  match_id: number | string;
  player_id: number | string;
  team_id: number | string;

  type:
    | 'GOAL'
    | 'ASSIST'
    | 'YELLOW_CARD'
    | 'RED_CARD'
    | 'SUBSTITUTION';

  minute: number;

  session_id?: string;

  /** Extras opcionales (UI) */
  playerName?: string;
  assistName?: string;
  playerOutName?: string;
}

/* ===================== MATCH ===================== */

export interface MatchResult {
  id: number | string;

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

/* ===================== TEAM OF THE WEEK ===================== */

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl?: string;
  teamDataAiHint?: string;
}

/* ===================== CONTEXT ===================== */

export interface LeagueContextType {
  teams: Team[];
  divisions: Division[];
  matches: MatchResult[];
  matchEvents: MatchEvent[];
  players: Player[];

  isLoaded: boolean;
  sessionId: string;

  /* ===== TEMPORADA ===== */
  season: number;
  nextSeason: () => void;

  /* ===== TEAMS ===== */
  addTeam: (team: Team) => void;
  deleteTeam: (id: number | string) => void;
  updateTeam: (team: Team) => void;

  /* ===== PLAYERS ===== */
  addPlayerToTeam: (teamId: number | string, player: Player) => void;
  removePlayerFromTeam: (
    teamId: number | string,
    playerId: number | string
  ) => void;

  /* ===== GETTERS ===== */
  getTeamById: (id: number | string) => Team | undefined;
  getPlayerById: (id: number | string) => Player | undefined;
  getTeamByPlayerId: (playerId: number | string) => Team | undefined;

  /* ===== MATCHES ===== */
  simulateMatchday: () => Promise<void>;
  getMatchEvents: (matchId: number | string) => MatchEvent[];

  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];

  /* week | month | season */
  getBestEleven: (
    type: 'week' | 'month' | 'season',
    value?: number
  ) => TeamOfTheWeekPlayer[];

  lastPlayedWeek: number;

  /* ===== CLASIFICACIONES ===== */
  getLeagueQualifiers: (
    divisionId: number
  ) => {
    titanPeak: Team[];
    colossusShield: Team[];
  };

  getSeasonAwards: () => {
    pichichi: Player | undefined;
    assistMaster: Player | undefined;
    bestGoalkeeper: Player | undefined;
  };

  drawTournament: (
    competitionName: 'The Titan Peak' | 'Colossus Shield'
  ) => Promise<void>;

  /* ===== DATA ===== */
  resetLeagueData: () => void;
  importLeagueData: (newData: any) => boolean;
  refreshData: () => Promise<void>;
}
