/**
 * src/lib/types.ts
 */

export interface Player {
  id: number;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'; // Obligatorio para la IA
  country?: string; // País del jugador
  face_url?: string; // URL opcional de la cara
  rating: number;
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
}

export interface Division {
  id: number;
  name: string;
}

export interface MatchEvent {
  id: number;
  playerId: number | string;
  playerName: string;
  teamId: number | string;
  type: 'goal' | 'yellow' | 'red';
  minute: number;
}

export interface MatchResult {
  id: number | string;
  season: number;
  week: number;
  homeTeamId: number | string;
  awayTeamId: number | string;
  homeScore: number;
  awayScore: number;
  isImportant: boolean;
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
  players: Player[];
  isLoaded: boolean;
  addTeam: (team: Team) => void;
  deleteTeam: (id: number | string) => void;
  updateTeam: (team: Team) => void;
  addPlayerToTeam: (teamId: number | string, player: Player) => void;
  removePlayerFromTeam: (teamId: number | string, playerId: number | string) => void;
  getTeamById: (id: number | string) => Team | undefined;
  getPlayerById: (id: number | string) => Player | undefined;
  getTeamByPlayerId: (playerId: number | string) => Team | undefined;
  simulateMatchday: () => void;
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: string, val?: number) => TeamOfTheWeekPlayer[];
  resetLeagueData: () => void;
  importLeagueData: (newData: any) => boolean;
}