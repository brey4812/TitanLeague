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
  logoUrl: string;
  dataAiHint: string;
  division: number;
  divisionName: string;
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  roster: Player[];
}

// Interfaz para el 11 ideal
export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl: string;
  teamDataAiHint: string;
}

// Interfaz para los resultados de partidos
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

// Interfaz para las divisiones de la liga
export interface Division {
  id: number;
  name: string;
  teams: Team[];
}

// Para las comparativas directas
export interface H2HRecord {
  team1Id: number;
  team2Id: number;
  wins: number;
  draws: number;
  losses: number;
}