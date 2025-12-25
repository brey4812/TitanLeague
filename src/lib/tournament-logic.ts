import { createClient } from "@supabase/supabase-js";
import { Team, MatchResult } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function drawTournamentLogic(
  competitionName: 'The Titan Peak' | 'Colossus Shield',
  qualifiers: Team[],
  sessionId: string,
  seasonId: number
) {
  // 1. Necesitamos 16 equipos para Octavos de Final
  const requiredTeams = 16;
  const missingCount = requiredTeams - qualifiers.length;

  let tournamentTeams = [...qualifiers];

  // 2. Traer equipos externos (que no están en divisiones activas) de Supabase
  if (missingCount > 0) {
    const { data: externalTeams } = await supabase
      .from('teams')
      .select('*')
      .is('division_id', null) // Equipos "libres"
      .limit(missingCount);

    if (externalTeams) {
      tournamentTeams = [...tournamentTeams, ...externalTeams];
    }
  }

  // 3. Mezclar equipos aleatoriamente
  tournamentTeams.sort(() => Math.random() - 0.5);

  // 4. Crear los emparejamientos de Octavos (Ida)
  const matchesToCreate = [];
  for (let i = 0; i < tournamentTeams.length; i += 2) {
    matchesToCreate.push({
      home_team: tournamentTeams[i].id,
      away_team: tournamentTeams[i + 1].id,
      round: 1, // Octavos
      played: false,
      competition: competitionName,
      session_id: sessionId,
      season_id: seasonId,
    });
  }

  // 5. Insertar en Supabase
  const { data, error } = await supabase.from('matches').insert(matchesToCreate);
  return { data, error };
}