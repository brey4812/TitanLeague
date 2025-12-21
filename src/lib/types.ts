export interface Player {
  id: number;
  name: string;
  nationality: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
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
  teams: Team[];
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
}

export interface H2HRecord {
  team1Id: number;
  team2Id: number;
  wins: number;
  draws: number;
  losses: number;
}
