import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // 1. Obtener eventos de gol usando los nombres exactos de tu tabla
    const { data: events, error: eError } = await supabase
      .from("match_events")
      .select("player_id")
      .eq("type", "GOAL");

    if (eError) throw eError;

    // 2. Obtener jugadores y sus equipos para mostrar nombres y escudos
    const { data: players, error: pError } = await supabase
      .from("players")
      .select(`
        id, 
        name, 
        teams (name, badge_url)
      `);

    if (pError) throw pError;

    // 3. Procesar el ranking de goleadores (Top 10)
    const leaderboard = players.map(player => ({
      ...player,
      goals: events.filter(e => String(e.player_id) === String(player.id)).length
    }))
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

    return NextResponse.json({ ok: true, data: { topScorers: leaderboard } });

  } catch (err: any) {
    console.error("Error en la API:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}