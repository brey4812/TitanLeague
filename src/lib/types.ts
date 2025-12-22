/**
 * src/lib/types.ts
 * Definición central de interfaces para la Liga Titán
 */

export interface Player {
  id: number;
  name: string;
  nationality: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  rating: number; 
  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    cards: { 
      yellow: number; 
      red: number 
    };
    mvp: number;
  };
}

export interface Team {
  id: number;
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
}

export interface Division {
  id: number;
  name: string;
}

/**
 * Eventos detallados para el Panel de Control
 */
export interface MatchEvent {
  id: number;
  playerId: number;
  playerName: string;
  teamId: number;
  type: 'goal' | 'yellow' | 'red';
  minute: number;
}

export interface MatchResult {
  id: number;
  season: number;
  week: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  isImportant: boolean;
  mvpId?: number;
  events?: MatchEvent[]; // Para ver goles y tarjetas al hacer click
}

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl: string;
  teamDataAiHint: string;
}

/**
 * Contrato del Contexto de la Liga
 */
export interface LeagueContextType {
  teams: Team[];
  divisions: Division[];
  matches: MatchResult[];
  players: Player[];
  isLoaded: boolean;
  addTeam: (team: Team) => void;
  deleteTeam: (id: number) => void;
  updateTeam: (team: Team) => void;
  getTeamById: (id: number) => Team | undefined;
  getPlayerById: (id: number) => Player | undefined;
  getTeamByPlayerId: (playerId: number) => Team | undefined;
  simulateMatchday: () => void;
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: string, val?: number) => TeamOfTheWeekPlayer[];
  resetLeagueData: () => void;
}