import type { Team, Division, MatchResult, Player, TeamOfTheWeekPlayer } from '@/lib/types';

let playerIdCounter = 0;

const generatePlayers = (teamId: number, position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward', count: number, namePrefix: string): Player[] => {
  const players: Player[] = [];
  const nationalities = ['Brazilian', 'Argentinian', 'German', 'French', 'Spanish', 'Italian', 'English', 'Dutch', 'Portuguese', 'Belgian'];
  for (let i = 1; i <= count; i++) {
    players.push({
      id: playerIdCounter++,
      name: `${namePrefix} ${i}`,
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      position: position,
      stats: {
        goals: Math.floor(Math.random() * (position === 'Forward' ? 20 : 5)),
        assists: Math.floor(Math.random() * 15),
        cleanSheets: position === 'Goalkeeper' ? Math.floor(Math.random() * 10) : 0,
        cards: { yellow: Math.floor(Math.random() * 10), red: Math.floor(Math.random() * 2) },
        mvp: Math.floor(Math.random() * 5),
      },
    });
  }
  return players;
};

const teams: Team[] = [
  {
    id: 1, name: 'Crimson Hawks', logoUrl: 'https://picsum.photos/seed/1/100/100', dataAiHint: 'hawk bird', division: 1, divisionName: 'Titan Prime Division',
    stats: { wins: 18, draws: 8, losses: 4, goalsFor: 55, goalsAgainst: 25 },
    roster: [
      ...generatePlayers(1, 'Goalkeeper', 2, 'GK'),
      ...generatePlayers(1, 'Defender', 7, 'DF'),
      ...generatePlayers(1, 'Midfielder', 7, 'MF'),
      ...generatePlayers(1, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 2, name: 'Azure Dragons', logoUrl: 'https://picsum.photos/seed/2/100/100', dataAiHint: 'dragon simple', division: 1, divisionName: 'Titan Prime Division',
    stats: { wins: 20, draws: 5, losses: 5, goalsFor: 65, goalsAgainst: 30 },
    roster: [
      ...generatePlayers(2, 'Goalkeeper', 2, 'GK'),
      ...generatePlayers(2, 'Defender', 7, 'DF'),
      ...generatePlayers(2, 'Midfielder', 7, 'MF'),
      ...generatePlayers(2, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 3, name: 'Golden Lions', logoUrl: 'https://picsum.photos/seed/3/100/100', dataAiHint: 'lion head', division: 1, divisionName: 'Titan Prime Division',
    stats: { wins: 15, draws: 10, losses: 5, goalsFor: 45, goalsAgainst: 35 },
    roster: [
        ...generatePlayers(3, 'Goalkeeper', 2, 'Keeper'),
        ...generatePlayers(3, 'Defender', 6, 'Guard'),
        ...generatePlayers(3, 'Midfielder', 8, 'Maestro'),
        ...generatePlayers(3, 'Forward', 4, 'Striker'),
    ]
  },
  {
    id: 4, name: 'Shadow Wolves', logoUrl: 'https://picsum.photos/seed/4/100/100', dataAiHint: 'wolf silhouette', division: 1, divisionName: 'Titan Prime Division',
    stats: { wins: 12, draws: 10, losses: 8, goalsFor: 40, goalsAgainst: 38 },
    roster: [
        ...generatePlayers(4, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(4, 'Defender', 7, 'DF'),
        ...generatePlayers(4, 'Midfielder', 7, 'MF'),
        ...generatePlayers(4, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 5, name: 'Steel Knights', logoUrl: 'https://picsum.photos/seed/5/100/100', dataAiHint: 'knight helmet', division: 2, divisionName: 'Second Division',
    stats: { wins: 22, draws: 4, losses: 4, goalsFor: 70, goalsAgainst: 28 },
    roster: [
        ...generatePlayers(5, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(5, 'Defender', 7, 'DF'),
        ...generatePlayers(5, 'Midfielder', 7, 'MF'),
        ...generatePlayers(5, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 6, name: 'Phoenix Rising', logoUrl: 'https://picsum.photos/seed/6/100/100', dataAiHint: 'phoenix fire', division: 2, divisionName: 'Second Division',
    stats: { wins: 19, draws: 6, losses: 5, goalsFor: 60, goalsAgainst: 32 },
    roster: [
        ...generatePlayers(6, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(6, 'Defender', 7, 'DF'),
        ...generatePlayers(6, 'Midfielder', 7, 'MF'),
        ...generatePlayers(6, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 7, name: 'Arctic Bears', logoUrl: 'https://picsum.photos/seed/7/100/100', dataAiHint: 'polar bear', division: 2, divisionName: 'Second Division',
    stats: { wins: 14, draws: 9, losses: 7, goalsFor: 50, goalsAgainst: 40 },
    roster: [
        ...generatePlayers(7, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(7, 'Defender', 7, 'DF'),
        ...generatePlayers(7, 'Midfielder', 7, 'MF'),
        ...generatePlayers(7, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 8, name: 'Thunder Strikers', logoUrl: 'https://picsum.photos/seed/8/100/100', dataAiHint: 'lightning bolt', division: 2, divisionName: 'Second Division',
    stats: { wins: 10, draws: 12, losses: 8, goalsFor: 42, goalsAgainst: 45 },
    roster: [
        ...generatePlayers(8, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(8, 'Defender', 7, 'DF'),
        ...generatePlayers(8, 'Midfielder', 7, 'MF'),
        ...generatePlayers(8, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 9, name: 'Forest Rangers', logoUrl: 'https://picsum.photos/seed/9/100/100', dataAiHint: 'pine tree', division: 3, divisionName: 'Third Division',
    stats: { wins: 25, draws: 2, losses: 3, goalsFor: 80, goalsAgainst: 20 },
    roster: [
        ...generatePlayers(9, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(9, 'Defender', 7, 'DF'),
        ...generatePlayers(9, 'Midfielder', 7, 'MF'),
        ...generatePlayers(9, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 10, name: 'Ocean Giants', logoUrl: 'https://picsum.photos/seed/10/100/100', dataAiHint: 'ocean wave', division: 3, divisionName: 'Third Division',
    stats: { wins: 1, draws: 1, losses: 28, goalsFor: 15, goalsAgainst: 90 },
    roster: [
        ...generatePlayers(10, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(10, 'Defender', 7, 'DF'),
        ...generatePlayers(10, 'Midfielder', 7, 'MF'),
        ...generatePlayers(10, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 11, name: 'Desert Scorpions', logoUrl: 'https://picsum.photos/seed/11/100/100', dataAiHint: 'scorpion icon', division: 4, divisionName: 'Fourth Division',
    stats: { wins: 10, draws: 10, losses: 10, goalsFor: 35, goalsAgainst: 35 },
    roster: [
        ...generatePlayers(11, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(11, 'Defender', 7, 'DF'),
        ...generatePlayers(11, 'Midfielder', 7, 'MF'),
        ...generatePlayers(11, 'Forward', 5, 'FW'),
    ]
  },
  {
    id: 12, name: 'Volcano Vipers', logoUrl: 'https://picsum.photos/seed/12/100/100', dataAiHint: 'snake fangs', division: 4, divisionName: 'Fourth Division',
    stats: { wins: 14, draws: 8, losses: 8, goalsFor: 48, goalsAgainst: 40 },
    roster: [
        ...generatePlayers(12, 'Goalkeeper', 2, 'GK'),
        ...generatePlayers(12, 'Defender', 7, 'DF'),
        ...generatePlayers(12, 'Midfielder', 7, 'MF'),
        ...generatePlayers(12, 'Forward', 5, 'FW'),
    ]
  }
];

export const divisions: Division[] = [
  { id: 1, name: 'Titan Prime Division', teams: teams.filter(t => t.division === 1) },
  { id: 2, name: 'Second Division', teams: teams.filter(t => t.division === 2) },
  { id: 3, name: 'Third Division', teams: teams.filter(t => t.division === 3) },
  { id: 4, name: 'Fourth Division', teams: teams.filter(t => t.division === 4) },
];

export const matchResults: MatchResult[] = [
  { id: 1, season: 1, week: 5, homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 2, isImportant: true, mvpId: 104 },
  { id: 2, season: 1, week: 5, homeTeamId: 3, awayTeamId: 4, homeScore: 1, awayScore: 0, isImportant: false, mvpId: 302 },
  { id: 3, season: 1, week: 5, homeTeamId: 5, awayTeamId: 6, homeScore: 3, awayScore: 1, isImportant: false, mvpId: 504 },
  { id: 4, season: 1, week: 5, homeTeamId: 7, awayTeamId: 8, homeScore: 0, awayScore: 0, isImportant: false, mvpId: 701 },
];

export const getAllTeams = (): Team[] => teams;

export const getTeamById = (id: number): Team | undefined => teams.find(t => t.id === id);

export const getTeamByPlayerId = (playerId: number): Team | undefined => {
    return teams.find(team => team.roster.some(player => player.id === playerId));
};

export const getAllPlayers = (): Player[] => teams.flatMap(t => t.roster);

export const getPlayerById = (id: number): Player | undefined => getAllPlayers().find(p => p.id === id);

export const getTeamOfTheWeek = (week: number): TeamOfTheWeekPlayer[] => {
    // This is a mock function. In a real app, you'd have a more complex logic
    // to determine the team of the week based on performance.
    const allPlayers = getAllPlayers();
    const shuffled = allPlayers.sort(() => 0.5 - Math.random());
    const totwPlayers = shuffled.slice(0, 11);
    
    return totwPlayers.map(player => {
        const team = getTeamByPlayerId(player.id);
        return {
            ...player,
            teamName: team?.name || 'Unknown',
            teamLogoUrl: team?.logoUrl || '',
            teamDataAiHint: team?.dataAiHint || '',
        }
    })
};
