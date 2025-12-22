import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { matchId } = await req.json();

    // 1. Obtener datos del partido y de los equipos
    const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
    if (!match) return NextResponse.json({ error: "Partido no encontrado" });

    // 2. Simular goles (usando lógica simple o poisson)
    const homeGoals = Math.floor(Math.random() * 4);
    const awayGoals = Math.floor(Math.random() * 3);

    // 3. REPARTIR GOLES A JUGADORES REALES
    const assignStats = async (teamId: number, goals: number) => {
      if (goals === 0) return;
      
      const { data: squad } = await supabase.from("players").select("id").eq("team_id", teamId);
      if (!squad || squad.length === 0) return;

      for (let i = 0; i < goals; i++) {
        const scorer = squad[Math.floor(Math.random() * squad.length)];
        
        // Registrar el evento en la tabla match_events
        await supabase.from("match_events").insert({
          match_id: matchId,
          player_id: scorer.id,
          type: "goal",
          minute: Math.floor(Math.random() * 90) + 1
        });

        // Sumar el gol al acumulado del jugador para los Premios
        const { data: p } = await supabase.from("players").select("goals").eq("id", scorer.id).single();
        await supabase.from("players").update({ goals: (p?.goals || 0) + 1 }).eq("id", scorer.id);
      }
    };

    await assignStats(match.home_team, homeGoals);
    await assignStats(match.away_team, awayGoals);

    // 4. Actualizar el partido como jugado
    await supabase.from("matches").update({
      home_goals: homeGoals,
      away_goals: awayGoals,
      played: true
    }).eq("id", matchId);

    return NextResponse.json({ ok: true, score: `${homeGoals}-${awayGoals}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}