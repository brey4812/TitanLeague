/**
 * src/lib/types.ts
 * Sincronización completa con Supabase DB y UI
 */

/* ===================== PLAYER ===================== */

export interface Player {
  id: number | string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  country?: string;
  nationality?: string; // Añadido para consistencia con la DB y el buscador
  face_url?: string;
  image_url?: string | null; // Añadido para compatibilidad con componentes de UI
  team_id?: number | string;

  /** ⭐ MEDIA ACTUAL (calculada o base) */
  rating: number;

  /** ⭐ HISTORIAL DE VALORACIONES POR PARTIDO */
  matchRatings?: {
    season: number;
    week: number;
    rating: number; // Valoración de rendimiento 1.0 – 10.0
  }[];

  /** 🟥🟨 DISCIPLINA / SANCIONES */
  disciplinary?: {
    yellowAccumulated: number;     // Tarjetas acumuladas en la temporada
    suspendedUntilWeek?: number;   // Jornada hasta la que está sancionado
  };

  /** ⭐ ESTADÍSTICAS DEL JUGADOR */
  stats?: {
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

  /** ⭐ ESTADÍSTICAS ACUMULADAS (Cálculo dinámico) */
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
  /** * 'SUB' se usa para simplificar la lógica de cambios en la API.
   * 'CLEAN_SHEET' permite registrar el rendimiento defensivo.
   * 'SECOND_YELLOW' gestiona la expulsión por doble amonestación.
   */
  type: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW' | 'SUBSTITUTION' | 'SUB' | 'CLEAN_SHEET';
  minute: number;
  session_id?: string;

  /** ⚡ SINCRONIZACIÓN DB (Snake Case) */
  player_name?: string;
  assist_name?: string;
  player_out_name?: string;

  /** ⚡ SINCRONIZACIÓN UI (Camel Case) */
  playerName?: string;
  assistName?: string;
  playerOutName?: string;
}

/* ===================== MATCH ===================== */

export interface MatchResult {
  id: number | string;
  
  /** ⚡ REQUERIDO: season_id para coincidir con la DB */
  season_id: number | string; 
  
  /** Campos adicionales para compatibilidad con UI */
  season?: number;
  round?: number; // Usado para identificar la jornada en la UI
  matchday: number; // Valor real en la base de datos (int4)

  home_team: number | string;
  away_team: number | string;

  home_goals: number;
  away_goals: number;

  played: boolean;
  division_id: number;

  competition?: string; // Ej: "League", "Tournament"
  session_id: string; // Identificador único del usuario/sesión

  mvpId?: number | string;
  events?: MatchEvent[];
}

/* ===================== TEAM OF THE WEEK ===================== */

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl?: string;
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
  isSeasonFinished: boolean;

  /* ===== TEMPORADA ===== */
  season: number;
  nextSeason: () => Promise<void>;

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

  /** 🏆 SORTEO DE COMPETICIÓN INTERNACIONAL */
  drawTournament: (
    competitionName: 'The Titan Peak' | 'Colossus Shield'
  ) => Promise<void>;

  /* ===== DATA ===== */
  resetLeagueData: () => Promise<void>;
  importLeagueData: (newData: any) => boolean;
  refreshData: () => Promise<void>;
}