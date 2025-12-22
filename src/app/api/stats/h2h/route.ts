import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamA = searchParams.get("teamA");
    const teamB = searchParams.get("teamB");

    if (!teamA || !teamB) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros" }, { status: 400 });
    }

    // Buscamos partidos donde TeamA fue local y TeamB visitante, O VICEVERSA
    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team(name, badge_url),
        away:teams!away_team(name, badge_url)
      `)
      .or(`and(home_team.eq.${teamA},away_team.eq.${teamB}),and(home_team.eq.${teamB},away_team.eq.${teamA})`)
      .eq("played", true)
      .order("id", { ascending: false });

    if (error) throw error;

    // Calcular estadísticas acumuladas
    const winsA = matches.filter(m => 
      (m.home_team == teamA && m.home_goals > m.away_goals) || 
      (m.away_team == teamA && m.away_goals > m.home_goals)
    ).length;

    const winsB = matches.filter(m => 
      (m.home_team == teamB && m.home_goals > m.away_goals) || 
      (m.away_team == teamB && m.away_goals > m.home_goals)
    ).length;

    const draws = matches.filter(m => m.home_goals === m.away_goals).length;

    return NextResponse.json({ 
      ok: true, 
      stats: { winsA, winsB, draws, total: matches.length },
      history: matches 
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}