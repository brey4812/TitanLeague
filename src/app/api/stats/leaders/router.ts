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

    // Base para consultas de jugadores (evita repetición de código)
    const playerQuery = `
      id, name, position, goals, assists, clean_sheets, yellow_cards, red_cards,
      teams (id, name, badge_url)
    `;

    // 2. Obtener Top Goleadores
    const { data: scorers } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("goals", 0)
      .order("goals", { ascending: false })
      .limit(10);

    // 3. Obtener Top Asistentes
    const { data: assistants } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("assists", 0)
      .order("assists", { ascending: false })
      .limit(10);

    // 4. Obtener Guantes de Oro (Porteros con vallas invictas)
    const { data: keepers } = await supabase
      .from("players")
      .select(playerQuery)
      .eq("position", "Goalkeeper")
      .gt("clean_sheets", 0)
      .order("clean_sheets", { ascending: false })
      .limit(10);

    // 5. Disciplina - Más Tarjetas Amarillas
    const { data: yellowCards } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("yellow_cards", 0)
      .order("yellow_cards", { ascending: false })
      .limit(5);

    // 6. Disciplina - Más Tarjetas Rojas
    const { data: redCards } = await supabase
      .from("players")
      .select(playerQuery)
      .gt("red_cards", 0)
      .order("red_cards", { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: true,
      data: {
        standings: standings || [],
        topScorers: scorers || [],
        topAssists: assistants || [],
        topKeepers: keepers || [],
        yellowCards: yellowCards || [],
        redCards: redCards || []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}