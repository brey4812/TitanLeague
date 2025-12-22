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
    cards: { yellow: number; red: number };
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
  division_id: number; // Cambiado a obligatorio para evitar errores en las tablas de liga
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

// Nueva interfaz necesaria para el correcto tipado en LeaguesPage
export interface Division {
  id: number;
  name: string;
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
}

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl: string;
  teamDataAiHint: string;
}

export interface LeagueContextType {
  teams: Team[];
  divisions: Division[]; // Añadido para que LeaguesPage pueda iterar sobre ellas
  matches: MatchResult[];
  players: Player[];
  isLoaded: boolean;
  addTeam: (team: Team) => void;
  deleteTeam: (id: number) => void;
  updateTeam: (team: Team) => void;
  getTeamById: (id: number) => Team | undefined;
  getTeamByPlayerId: (id: number) => Team | undefined;
  getTeamOfTheWeek: (week: number) => TeamOfTheWeekPlayer[];
  getBestEleven: (type: string, val?: number) => TeamOfTheWeekPlayer[];
  simulateMatchday: () => void;
  resetLeagueData: () => void;
}