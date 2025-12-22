import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { divisionId } = await req.json();
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    if (!divisionId) {
      return NextResponse.json({ ok: false, error: "Debes especificar un divisionId" }, { status: 400 });
    }

    // 1. Obtener todos los equipos de esa división que tengan ID de la API
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .eq("division_id", divisionId)
      .not("external_id", "is", null);

    if (teamsError || !teams || teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay equipos con API ID en esta división" });
    }

    let totalImported = 0;
    const report = [];

    // 2. Recorrer los equipos e importar sus jugadores
    for (const team of teams) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`
        );
        const data = await response.json();

        if (data.player) {
          const playersToInsert = data.player.map((p: any) => ({
            team_id: team.id,
            name: p.strPlayer,
            position: p.strPosition,
            rating: Math.floor(Math.random() * (85 - 72 + 1)) + 72,
            goals: 0,
            assists: 0,
            clean_sheets: 0
          }));

          const { error: upsertError } = await supabase
            .from("players")
            .upsert(playersToInsert, { onConflict: 'name, team_id' });

          if (!upsertError) {
            totalImported += playersToInsert.length;
            report.push({ team: team.name, status: "OK", count: playersToInsert.length });
          }
        }
      } catch (e) {
        report.push({ team: team.name, status: "Error" });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Importación masiva completada. ${totalImported} jugadores añadidos.`,
      details: report
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}