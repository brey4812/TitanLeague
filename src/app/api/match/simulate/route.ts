import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { matchId } = await req.json();

    // 1. Obtener datos del partido
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) return NextResponse.json({ error: "Partido no encontrado" });
    if (match.played) return NextResponse.json({ error: "Este partido ya ha sido simulado" });

    // 2. Lógica de goles aleatorios (puedes mejorarla con ratings después)
    const homeGoals = Math.floor(Math.random() * 4);
    const awayGoals = Math.floor(Math.random() * 3);

    // 3. Función para repartir goles a jugadores reales en Supabase
    const assignStats = async (teamId: number, goals: number) => {
      if (goals === 0) return;
      
      const { data: squad } = await supabase
        .from("players")
        .select("id, goals")
        .eq("team_id", teamId);

      if (!squad || squad.length === 0) return;

      for (let i = 0; i < goals; i++) {
        // Seleccionamos un jugador al azar para el gol
        const scorer = squad[Math.floor(Math.random() * squad.length)];
        
        // A. Insertar el evento de gol
        await supabase.from("match_events").insert({
          match_id: matchId,
          player_id: scorer.id,
          type: "goal",
          minute: Math.floor(Math.random() * 90) + 1
        });

        // B. Actualizar contador de goles en la tabla players (columna 'goals')
        await supabase
          .from("players")
          .update({ goals: (scorer.goals || 0) + 1 })
          .eq("id", scorer.id);
      }
    };

    // Procesar reparto de goles para ambos equipos
    await assignStats(match.home_team_id, homeGoals);
    await assignStats(match.away_team_id, awayGoals);

    // 4. Finalizar el partido
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_goals: homeGoals,
        away_goals: awayGoals,
        played: true
      })
      .eq("id", matchId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      ok: true, 
      score: `${homeGoals}-${awayGoals}`,
      message: "Partido simulado y estadísticas actualizadas" 
    });

  } catch (err: any) {
    console.error("Error en simulate:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}