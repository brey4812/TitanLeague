import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No hay equipos con ID externo"
      });
    }

    let totalImported = 0;
    const report: string[] = [];

    for (const team of teams) {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`
      );

      const data = await res.json();

      if (!data?.player) {
        report.push(`${team.name}: sin jugadores`);
        continue;
      }

      const playersToInsert = data.player.map((p: any) => ({
        external_id: p.idPlayer,
        name: p.strPlayer,
        position: p.strPosition,
        team_id: team.id,
        rating: Math.floor(Math.random() * (88 - 72 + 1)) + 72,
        goals: 0,
        assists: 0,
        clean_sheets: 0
      }));

      const { error: upsertError } = await supabase
        .from("players")
        .upsert(playersToInsert, { onConflict: "external_id" });

      if (upsertError) {
        report.push(`${team.name}: ERROR`);
      } else {
        totalImported += playersToInsert.length;
        report.push(`${team.name}: OK (${playersToInsert.length})`);
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Jugadores importados correctamente",
      total_jugadores: totalImported,
      resumen: report
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
