import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Recibimos el sessionId para garantizar que la simulación sea privada
    const { divisionId, week, sessionId } = await req.json();

    if (!divisionId || !week || !sessionId) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros: divisionId, week o sessionId" }, 
        { status: 400 }
      );
    }

    // 2. Buscamos partidos pendientes para esta sesión y jornada
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team")
      .eq("division_id", divisionId)
      .eq("round", week)
      .eq("played", false)
      .eq("session_id", sessionId);

    if (matchError) throw matchError;
    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: "No hay partidos pendientes." });
    }

    // Obtenemos los jugadores de los equipos involucrados
    const teamIds = matches.flatMap(m => [m.home_team, m.away_team]);
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, name")
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

      const events: any[] = [];
      const homeRoster = allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [];
      const awayRoster = allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || [];

      // Función para generar sucesos (Goles, Asistencias, Tarjetas)
      const generateEvents = (roster: any[], goals: number) => {
        if (roster.length === 0) return;

        for (let i = 0; i < goals; i++) {
          const minute = Math.floor(Math.random() * 90) + 1;
          const scorer = roster[Math.floor(Math.random() * roster.length)];
          
          let assistantName = null;

          // Lógica de Asistencia (70% de probabilidad)
          if (Math.random() < 0.7 && roster.length > 1) {
            const assistant = roster.filter(p => p.id !== scorer.id)[Math.floor(Math.random() * (roster.length - 1))];
            assistantName = assistant.name;
            
            events.push({
              match_id: match.id,
              player_id: assistant.id,
              playerName: assistant.name,
              type: 'ASSIST',
              minute,
              session_id: sessionId
            });
          }

          // Registro de GOL
          events.push({
            match_id: match.id,
            player_id: scorer.id,
            playerName: scorer.name,
            assistName: assistantName, // Vinculamos el nombre del asistente para el modal
            type: 'GOAL',
            minute,
            session_id: sessionId
          });
        }

        // LÓGICA DE TARJETAS (40% de probabilidad por equipo)
        if (Math.random() < 0.4) {
          const penalized = roster[Math.floor(Math.random() * roster.length)];
          const isRed = Math.random() < 0.15; // 15% de que sea roja directa
          
          events.push({
            match_id: match.id,
            player_id: penalized.id,
            playerName: penalized.name,
            type: isRed ? 'RED_CARD' : 'YELLOW_CARD',
            minute: Math.floor(Math.random() * 90) + 1,
            session_id: sessionId
          });
        }
      };

      generateEvents(homeRoster, homeGoals);
      generateEvents(awayRoster, awayGoals);

      // 4. Inserción masiva de eventos
      if (events.length > 0) {
        const { error: insertError } = await supabase.from("match_events").insert(events);
        if (insertError) console.error("Error insertando eventos:", insertError.message);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Simulación exitosa: ${matches.length} partidos y sus sucesos registrados.` 
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}