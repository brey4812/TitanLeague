import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") || "1";

    // 1. Obtener Tabla de Posiciones
    const { data: standings, error: stError } = await supabase
      .from("standings")
      .select(`
        *,
        teams (id, name, badge_url)
      `)
      .eq("season_id", seasonId)
      .order("points", { ascending: false })
      .order("goals_for", { ascending: false });

    if (stError) throw stError;

    // 2. Base para consultas de jugadores ajustada a tus COLUMNAS REALES
    // Eliminamos yellow_cards y red_cards si no están como columnas planas en tu DB
    const playerQuery = `
      id, name, position, goals, assists, clean_sheets, rating,
      teams (id, name, badge_url)
    `;

    // 3. Consultas de rendimiento
    const { data: scorers } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("goals", 0)
      .order("goals", { ascending: false })
      .limit(10);

    const { data: assistants } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("assists", 0)
      .order("assists", { ascending: false })
      .limit(10);

    const { data: keepers } = await supabase
      .from("players")
      .select(playerQuery)
      .eq("position", "Goalkeeper")
      .gt("clean_sheets", 0)
      .order("clean_sheets", { ascending: false })
      .limit(10);

    return NextResponse.json({
      ok: true,
      data: {
        standings: standings || [],
        topScorers: scorers || [],
        topAssists: assistants || [],
        topKeepers: keepers || [],
        // Enviamos arrays vacíos para disciplina si las columnas no existen aún 
        // para evitar que el frontend rompa al mapear undefined
        yellowCards: [], 
        redCards: []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}