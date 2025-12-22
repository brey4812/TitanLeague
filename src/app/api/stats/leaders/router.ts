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

    // 1. Obtener Tabla de Posiciones desde 'standings'
    const { data: standings, error: stError } = await supabase
      .from("standings")
      .select(`*, teams(name, badge_url)`)
      .eq("season_id", seasonId)
      .order("points", { ascending: false })
      .order("goals_for", { ascending: false });

    if (stError) throw stError;

    // 2. Obtener Top Goleadores (Pichichi) desde 'players'
    const { data: pichichi, error: pError } = await supabase
      .from("players")
      .select(`name, goals, teams(name, badge_url)`)
      .gt("goals", 0)
      .order("goals", { ascending: false })
      .limit(5);

    if (pError) throw pError;

    return NextResponse.json({
      ok: true,
      data: { standings, pichichi }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}