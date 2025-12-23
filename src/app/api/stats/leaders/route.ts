import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa service role para saltar RLS si es necesario
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") || "1";

    // 1. Obtener Equipos y sus jugadores
    const { data: teams, error: tError } = await supabase
      .from("teams")
      .select("id, name, badge_url, roster");

    if (tError) throw tError;

    // 2. Obtener todos los sucesos (Goles, Tarjetas) para calcular líderes
    const { data: events, error: eError } = await supabase
      .from("match_events")
      .select("*");

    if (eError) throw eError;

    // 3. Procesar datos localmente para asegurar exactitud
    const allPlayers = teams.flatMap(t => (t.roster || []).map((p: any) => {
      const pEvents = events.filter(e => String(e.player_id) === String(p.id));
      return {
        ...p,
        team: { name: t.name, badge_url: t.badge_url },
        goals: pEvents.filter(e => e.type === 'GOAL').length,
        yellow_cards: pEvents.filter(e => e.type === 'YELLOW_CARD').length,
        red_cards: pEvents.filter(e => e.type === 'RED_CARD').length,
        assists: pEvents.filter(e => e.type === 'ASSIST').length
      };
    }));

    // 4. Devolver Rankings
    return NextResponse.json({
      ok: true,
      data: {
        topScorers: allPlayers.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10),
        topAssists: allPlayers.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10),
        yellowCards: allPlayers.filter(p => p.yellow_cards > 0).sort((a, b) => b.yellow_cards - a.yellow_cards).slice(0, 10),
        redCards: allPlayers.filter(p => p.red_cards > 0).sort((a, b) => b.red_cards - a.red_cards).slice(0, 10)
      }
    });

  } catch (err: any) {
    console.error("Error en API Leaders:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}