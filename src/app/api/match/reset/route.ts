import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, seasonId } = await req.json();

    if (!divisionId || !seasonId) {
      return NextResponse.json(
        { ok: false, error: "divisionId y seasonId son obligatorios" },
        { status: 400 }
      );
    }

    // 1. Borrar todos los partidos de esa división en esa temporada
    const { error: deleteMatchesError } = await supabase
      .from("matches")
      .delete()
      .eq("division_id", divisionId)
      .eq("season_id", seasonId);

    if (deleteMatchesError) throw deleteMatchesError;

    // 2. Reiniciar las estadísticas en la tabla de Standings (Clasificación)
    // En lugar de borrar la fila, ponemos todo a 0 para que el equipo siga apareciendo en la tabla
    const { error: resetStandingsError } = await supabase
      .from("standings")
      .update({
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      })
      .eq("season_id", seasonId)
      // Necesitamos filtrar por los equipos que pertenecen a esa división
      .in('team_id', (
        await supabase.from('teams').select('id').eq('division_id', divisionId)
      ).data?.map(t => t.id) || []);

    if (resetStandingsError) throw resetStandingsError;

    return NextResponse.json({
      ok: true,
      message: "División reiniciada: partidos borrados y estadísticas a cero."
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}