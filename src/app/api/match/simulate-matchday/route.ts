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

    // 1. Obtener los partidos sin intentar hacer joins con players
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team")
      .eq("division_id", divisionId)
      .eq("round", week)
      .eq("played", false);

    if (matchError) throw matchError;
    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: "No hay partidos pendientes." });
    }

    // 2. Extraer todos los IDs de equipos para traer sus jugadores en una sola consulta
    const teamIds = matches.flatMap(m => [m.home_team, m.away_team]);
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id")
      .in("team_id", teamIds);

    if (playerError) throw playerError;

    for (const match of matches) {
      const homeGoals = Math.floor(Math.random() * 5); 
      const awayGoals = Math.floor(Math.random() * 4); 

      // 3. Actualizar el marcador del partido
      await supabase
        .from("matches")
        .update({
          home_goals: homeGoals,
          away_goals: awayGoals,
          played: true,
        })
        .eq("id", match.id);

      // 4. Filtrar jugadores localmente para asignar los goles
      const events: any[] = [];
      const homeRoster = allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [];
      const awayRoster = allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || [];

      // Goles Locales
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

      // Goles Visitantes
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

      // 5. Insertar eventos si hubo goles
      if (events.length > 0) {
        await supabase.from("match_events").insert(events);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Simulación exitosa: ${matches.length} partidos procesados.` 
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}