import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, seasonId } = await req.json();

    // 1. Obtener los equipos de la división específica
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("division_id", divisionId);

    if (!teams || teams.length < 2) {
      return NextResponse.json({ ok: false, error: "Equipos insuficientes para generar calendario" });
    }

    const teamIds = teams.map(t => t.id);
    // Si el número de equipos es impar, se añade un "Fantasma" (descanso)
    if (teamIds.length % 2 !== 0) teamIds.push(null as any);

    const totalRounds = teamIds.length - 1;
    const matchesPerRound = teamIds.length / 2;
    const matchesToCreate = [];

    // Algoritmo Round Robin para generar las jornadas
    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const home = teamIds[i];
        const away = teamIds[teamIds.length - 1 - i];

        if (home && away) {
          matchesToCreate.push({
            league_id: leagueId,
            division_id: divisionId,
            season_id: seasonId,
            home_team_id: home, // Nombre corregido para la relación con teams
            away_team_id: away, // Nombre corregido para la relación con teams
            week: round + 1,    // Nombre corregido para que el frontend lo encuentre
            played: false,
            home_goals: 0,
            away_goals: 0,
            competition: "League"
          });
        }
      }
      // Rotación de equipos para la siguiente jornada
      teamIds.splice(1, 0, teamIds.pop()!);
    }

    // 2. Insertar todos los partidos generados
    const { error } = await supabase.from("matches").insert(matchesToCreate);
    if (error) throw error;

    return NextResponse.json({ 
      ok: true, 
      message: `Calendario de ${totalRounds} jornadas creado con éxito.` 
    });

  } catch (err: any) {
    console.error("Error en generate:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}