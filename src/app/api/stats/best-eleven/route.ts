import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "week"; // week, month, season
    const value = searchParams.get("value") || "1"; // número de semana o mes

    // 1. Consultar eventos de gol filtrados por el tipo
    // Nota: Para simplificar, buscaremos los jugadores con más goles/asistencias en match_events
    let query = supabase
      .from("match_events")
      .select(`
        player_id,
        type,
        players (
          id, name, position, rating,
          teams (name, badge_url)
        ),
        matches!inner(week, date)
      `);

    if (type === "week") query = query.eq("matches.week", value);
    // Para 'month' o 'season' podrías filtrar por rango de fechas del objeto date

    const { data: events, error } = await query;
    if (error) throw error;

    // 2. Contar puntos por jugador (Gol = 3pts, Asistencia = 1pt)
    const playerPoints: any = {};
    events?.forEach((ev: any) => {
      const p = ev.players;
      if (!playerPoints[p.id]) {
        playerPoints[p.id] = { ...p, score: 0 };
      }
      playerPoints[p.id].score += ev.type === 'goal' ? 3 : 1;
    });

    // 3. Seleccionar el mejor por posición (Formación 4-3-3)
    const sortedPlayers = Object.values(playerPoints).sort((a: any, b: any) => b.score - a.score);
    
    // Filtramos para tener: 1 GK, 4 DEF, 3 MID, 3 FWD
    const eleven = {
      gk: sortedPlayers.find((p: any) => p.position === 'Goalkeeper'),
      def: sortedPlayers.filter((p: any) => p.position.includes('Back') || p.position.includes('Defender')).slice(0, 4),
      mid: sortedPlayers.filter((p: any) => p.position.includes('Midfielder')).slice(0, 3),
      fwd: sortedPlayers.filter((p: any) => p.position.includes('Forward') || p.position.includes('Striker')).slice(0, 3),
    };

    return NextResponse.json({ ok: true, eleven });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}