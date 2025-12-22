import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    // 1️⃣ Obtener equipos con external_id válido
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, external_id")
      .not("external_id", "is", null);

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No hay equipos con external_id en la base de datos"
      });
    }

    let totalImported = 0;
    const report: string[] = [];

    // 2️⃣ Recorremos equipo por equipo
    for (const team of teams) {
      const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`;

      const res = await fetch(url);

      if (!res.ok) {
        report.push(`${team.name}: ERROR HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();

      // ⚠️ TheSportsDB a veces devuelve HTML
      if (!text.startsWith("{")) {
        report.push(`${team.name}: respuesta no JSON (API falló)`);
        continue;
      }

      const data = JSON.parse(text);

      if (!data.player || data.player.length === 0) {
        report.push(`${team.name}: sin jugadores`);
        continue;
      }

      // 3️⃣ Mapear jugadores reales
      const playersToInsert = data.player.map((p: any) => ({
        name: p.strPlayer,
        position: p.strPosition || "Unknown",
        team_id: team.id,
        rating: Math.floor(Math.random() * (88 - 72 + 1)) + 72,
        goals: 0,
        assists: 0,
        clean_sheets: 0
      }));

      // 4️⃣ Insertar / actualizar sin duplicar
      const { error: upsertError } = await supabase
        .from("players")
        .upsert(playersToInsert, {
          onConflict: "name"
        });

      if (upsertError) {
        report.push(`${team.name}: error al insertar jugadores`);
        continue;
      }

      totalImported += playersToInsert.length;
      report.push(`${team.name}: OK (${playersToInsert.length} jugadores)`);
    }

    // 5️⃣ Respuesta final
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
