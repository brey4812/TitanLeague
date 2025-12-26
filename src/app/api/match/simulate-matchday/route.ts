import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

interface PlayerSim {
  id: string | number;
  team_id: string | number;
  name: string;
}

interface TeamData {
  home: PlayerSim[];
  away: PlayerSim[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { divisionId, week, sessionId, seasonId } = body;

    // 1. Validaciones iniciales de parámetros
    if (!week || !sessionId || !seasonId) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros críticos (week, session o season)" }, { status: 400 });
    }

    // 2. Bloqueo de seguridad: No permitir simular jornada N si la N-1 tiene partidos pendientes
    if (week > 1) {
      const { data: previousPending } = await supabase
        .from("matches")
        .select("id")
        .eq("session_id", sessionId)
        .eq("season_id", seasonId)
        .lt("matchday", week)
        .eq("played", false)
        .limit(1);

      if (previousPending && previousPending.length > 0) {
        return NextResponse.json({ 
          ok: false, 
          error: "Bloqueo: Existen jornadas anteriores sin completar. Simúlalas primero." 
        }, { status: 400 });
      }
    }

    // 3. Construcción de la consulta de partidos
    let query = supabase
      .from("matches")
      .select("*")
      .eq("matchday", week) 
      .eq("played", false)
      .eq("season_id", seasonId)
      .eq("session_id", sessionId);

    // Si se especifica una divisionId (botón individual), filtramos por ella.
    // Si no (botón Simular Todas), traerá todas las divisiones de esa jornada.
    if (divisionId) {
      query = query.eq("division_id", divisionId);
    }

    const { data: matches, error: matchError } = await query;

    if (matchError) throw matchError;

    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: `La jornada ${week} ya está completada o no tiene partidos programados.` 
      });
    }

    // 4. Obtener jugadores de los equipos involucrados
    const teamIds = Array.from(new Set(matches.flatMap(m => [m.home_team, m.away_team])));
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, name")
      .in("team_id", teamIds);

    if (playerError) throw playerError;

    // 5. Procesar cada partido
    for (const match of matches) {
      const matchEvents: any[] = [];
      const rosters: TeamData = {
        home: allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [],
        away: allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || []
      };

      const activePlayers: TeamData = {
        home: rosters.home.slice(0, 11),
        away: rosters.away.slice(0, 11)
      };

      let homeScore = 0;
      let awayScore = 0;

      // Simulación de 90 minutos
      for (let minute = 1; minute <= 90; minute++) {
        (["home", "away"] as const).forEach(side => {
          const teamId = side === "home" ? match.home_team : match.away_team;
          const available = activePlayers[side];

          if (available.length === 0) return;

          // Probabilidad de gol corregida para evitar resultados exagerados
          if (Math.random() < 0.007) {
            const scorer = available[Math.floor(Math.random() * available.length)];
            side === "home" ? homeScore++ : awayScore++;

            matchEvents.push({
              match_id: match.id,
              team_id: teamId,
              type: "GOAL",
              minute,
              player_id: scorer.id,
              player_name: scorer.name, 
              session_id: sessionId
            });
          }
        });
      }

      // 6. Actualizar Match
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_goals: homeScore,
          away_goals: awayScore,
          played: true
        })
        .eq("id", match.id);

      if (updateError) console.error(`Error actualizando partido ${match.id}:`, updateError.message);

      // 7. Insertar Eventos
      if (matchEvents.length > 0) {
        const { error: eventsError } = await supabase.from("match_events").insert(matchEvents);
        if (eventsError) console.error(`Error insertando eventos:`, eventsError.message);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Jornada ${week} procesada exitosamente.` 
    });

  } catch (err: any) {
    console.error("SIM ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}