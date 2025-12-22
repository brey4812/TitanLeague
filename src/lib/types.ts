/**
 * TIPOS PRINCIPALES DE LA LIGA TITÁN
 */

export interface Player {
  id: number;
  name: string;
  nationality: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  rating: number; // Puntuación general del jugador para el 11 ideal
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
  badge_url?: string; // Para compatibilidad con base de datos Supabase
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
  mvpId?: number;
  played?: boolean; // Para verificar si el partido ya se simuló
}

/**
 * ESTADÍSTICAS Y COMPARATIVAS
 */

export interface H2HRecord {
  team1Id: number;
  team2Id: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TeamOfTheWeekPlayer extends Player {
  teamName: string;
  teamLogoUrl: string;
  teamDataAiHint: string;
}

/**
 * COMPETICIONES Y TORNEOS (Temporada 2+)
 */

export interface Competition {
  id: number;
  name: string; // 'The Titan Peak', 'Colossus Shield', 'Titan’s Chalice'
  type: 'league' | 'cup';
  tier: number; // 0: Supercopa, 1: Champions, 2: Europa, 3: Copa
}

export interface TournamentEntry {
  id: number;
  season_id: number;
  competition_id: number;
  team_id: number;
  entry_reason: string; // Ejemplo: 'Top 4 League'
  teams?: Partial<Team>; // Datos del equipo unidos (join) desde la DB
  competitions?: Partial<Competition>;
}