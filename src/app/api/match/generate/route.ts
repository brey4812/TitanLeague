import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, seasonId } = await req.json();

    if (!leagueId || !divisionId || !seasonId) {
      return NextResponse.json(
        { ok: false, error: "leagueId, divisionId y seasonId son obligatorios" },
        { status: 400 }
      );
    }

    // 1. Obtener los equipos asignados a esa división
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("division_id", divisionId);

    if (teamsError || !teams || teams.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Se necesitan al menos 2 equipos en la división" },
        { status: 400 }
      );
    }

    const teamIds = teams.map((t) => t.id);
    
    // Si el número de equipos es impar, añadimos un "descanso" (null)
    if (teamIds.length % 2 !== 0) {
      teamIds.push(null as any);
    }

    const totalRounds = teamIds.length - 1;
    const matchesPerRound = teamIds.length / 2;
    const matchesToCreate = [];

    // 2. Algoritmo Round Robin para generar el calendario
    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const home = teamIds[i];
        const away = teamIds[teamIds.length - 1 - i];

        if (home !== null && away !== null) {
          matchesToCreate.push({
            league_id: leagueId,
            division_id: divisionId,
            season_id: seasonId,
            home_team_id: home,
            away_team_id: away,
            round: round + 1,
            played: false,
            home_goals: 0,
            away_goals: 0,
            competition: "League"
          });
        }
      }
      // Rotación de equipos (el primero se queda fijo)
      teamIds.splice(1, 0, teamIds.pop()!);
    }

    // 3. Insertar todos los partidos de una vez
    const { error: insertError } = await supabase
      .from("matches")
      .insert(matchesToCreate);

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      message: `Calendario generado: ${totalRounds} jornadas y ${matchesToCreate.length} partidos.`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}