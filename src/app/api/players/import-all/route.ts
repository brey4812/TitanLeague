import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY || "1";

  try {
    // 1. Obtenemos todos los equipos que tienen un ID de la API
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    if (teamsError || !teams || teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay equipos con ID de API para importar" });
    }

    let totalImported = 0;
    const stats = [];

    // 2. Recorremos cada equipo y traemos sus jugadores
    for (const team of teams) {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`
      );
      const data = await res.json();

      if (data && data.player) {
        const playersToInsert = data.player.map((p: any) => ({
          team_id: team.id, // Se asigna a este equipo inicialmente
          name: p.strPlayer,
          position: p.strPosition,
          rating: Math.floor(Math.random() * (85 - 70 + 1)) + 70, // Rating base
          goals: 0,
          assists: 0,
          clean_sheets: 0
        }));

        // Insertamos los jugadores (evitando duplicados por nombre)
        const { error: playerError } = await supabase
          .from("players")
          .upsert(playersToInsert, { onConflict: 'name' }); 

        if (!playerError) {
          totalImported += playersToInsert.length;
          stats.push({ equipo: team.name, jugadores: playersToInsert.length });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Proceso terminado. Se importaron ${totalImported} jugadores en total.`,
      detalle: stats
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}