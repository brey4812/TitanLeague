import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { teamId, externalId } = await req.json();
    const apiKey = process.env.THESPORTSDB_API_KEY;

    if (!teamId || !externalId) {
      return NextResponse.json(
        { ok: false, error: "teamId (interno) y externalId (API) son necesarios" },
        { status: 400 }
      );
    }

    // 1. Llamada a la API de TheSportsDB para obtener jugadores por ID de equipo
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${externalId}`
    );
    const data = await response.json();

    if (!data.player) {
      return NextResponse.json({ ok: false, error: "No se encontraron jugadores para este equipo" });
    }

    // 2. Mapear los jugadores al formato de tu base de datos
    const playersToInsert = data.player.map((p: any) => ({
      team_id: teamId,
      name: p.strPlayer,
      position: p.strPosition,
      // Como la API no da "rating", asignamos uno aleatorio entre 70 y 85 para que el simulador funcione
      rating: Math.floor(Math.random() * (85 - 70 + 1)) + 70,
      goals: 0,
      assists: 0,
      clean_sheets: 0
    }));

    // 3. Insertar en Supabase (usamos upsert por si ya existen)
    const { error } = await supabase
      .from("players")
      .upsert(playersToInsert, { onConflict: 'name, team_id' });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: `Se han importado ${playersToInsert.length} jugadores.`,
      players: playersToInsert
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}