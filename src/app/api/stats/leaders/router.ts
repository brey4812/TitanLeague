import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") || "1"; // Por defecto temporada 1
    const divisionId = searchParams.get("divisionId");

    // 1. OBTENER LA TABLA DE POSICIONES (Standings)
    // Ordenamos por puntos (desc), luego diferencia de goles (desc)
    const { data: table, error: tableError } = await supabase
      .from("standings")
      .select(`
        *,
        teams (name, badge_url)
      `)
      .eq("season_id", seasonId)
      .order("points", { ascending: false })
      .order("goals_for", { ascending: false });

    if (tableError) throw tableError;

    // 2. OBTENER EL TOP 5 GOLEADORES (Pichichi)
    const { data: scorers, error: scorersError } = await supabase
      .from("players")
      .select(`
        id, 
        name, 
        goals, 
        teams (name, badge_url)
      `)
      .gt("goals", 0) // Solo jugadores con al menos 1 gol
      .order("goals", { ascending: false })
      .limit(5);

    if (scorersError) throw scorersError;

    // 3. OBTENER EL TOP 5 ASISTENTES
    const { data: assistants, error: assistantsError } = await supabase
      .from("players")
      .select(`
        id, 
        name, 
        assists, 
        teams (name, badge_url)
      `)
      .gt("assists", 0)
      .order("assists", { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: true,
      data: {
        leagueTable: table,
        topScorers: scorers,
        topAssistants: assistants
      }
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}