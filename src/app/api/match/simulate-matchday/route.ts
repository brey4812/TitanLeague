import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { divisionId, week } = await req.json();

    if (!divisionId || !week) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros: divisionId o week" }, 
        { status: 400 }
      );
    }

    // 1. Buscamos los jugadores vinculados a los equipos de los partidos
    // Usamos 'players!home_team' para decirle a Supabase que use la FK de home_team para buscar jugadores
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select(`
        id,
        home_team,
        away_team,
        home_players:players!home_team ( id ),
        away_players:players!away_team ( id )
      `)
      .eq("division_id", divisionId)
      .eq("round", week)
      .eq("played", false);

    if (fetchError) throw fetchError;
    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: "No hay partidos pendientes." });
    }

    for (const match of matches) {
      const homeGoals = Math.floor(Math.random() * 5); 
      const awayGoals = Math.floor(Math.random() * 4); 

      // 2. Actualizar el marcador del partido
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_goals: homeGoals,
          away_goals: awayGoals,
          played: true,
        })
        .eq("id", match.id);

      if (updateError) throw updateError;

      // 3. Generar Sucesos (Goles) para la tabla match_events
      const events: any[] = [];
      
      // Goles Locales (usando home_players)
      const homeRoster = (match as any).home_players || [];
      for (let i = 0; i < homeGoals; i++) {
        if (homeRoster.length > 0) {
          const scorer = homeRoster[Math.floor(Math.random() * homeRoster.length)];
          events.push({
            match_id: match.id,
            player_id: scorer.id,
            type: 'GOAL',
            minute: Math.floor(Math.random() * 90) + 1
          });
        }
      }

      // Goles Visitantes (usando away_players)
      const awayRoster = (match as any).away_players || [];
      for (let i = 0; i < awayGoals; i++) {
        if (awayRoster.length > 0) {
          const scorer = awayRoster[Math.floor(Math.random() * awayRoster.length)];
          events.push({
            match_id: match.id,
            player_id: scorer.id,
            type: 'GOAL',
            minute: Math.floor(Math.random() * 90) + 1
          });
        }
      }

      // 4. Insertar eventos en la DB si hubo goles
      if (events.length > 0) {
        const { error: eventError } = await supabase.from("match_events").insert(events);
        if (eventError) console.error("Error al insertar eventos:", eventError.message);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Simulación exitosa: ${matches.length} partidos y sus goleadores registrados.` 
    });

  } catch (err: any) {
    console.error("Error en simulate-matchday:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}