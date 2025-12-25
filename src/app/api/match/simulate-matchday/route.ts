import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicialización con SERVICE_ROLE_KEY para permisos administrativos totales
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
    const { divisionId, week, sessionId } = body;

    if (!divisionId || !week || !sessionId) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // 1. Obtener partidos pendientes usando la columna correcta 'round' y 'session_id'
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("division_id", divisionId)
      .eq("round", week)
      .eq("played", false)
      .eq("session_id", sessionId);

    if (matchError) throw matchError;

    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: "No hay partidos pendientes para simular" });
    }

    // 2. Obtener jugadores de los equipos involucrados
    const teamIds = matches.flatMap(m => [m.home_team, m.away_team]);
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, name")
      .in("team_id", teamIds);

    if (playerError) throw playerError;

    // PROCESAMIENTO DE PARTIDOS
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

      const expelledIds = new Set<string>();
      const yellowCardsCount: Record<string, number> = {};
      let homeScore = 0;
      let awayScore = 0;

      // SIMULACIÓN LÓGICA DE 90 MINUTOS
      for (let minute = 1; minute <= 90; minute++) {
        (["home", "away"] as const).forEach(side => {
          const teamId = side === "home" ? match.home_team : match.away_team;
          const available = activePlayers[side].filter(p => !expelledIds.has(String(p.id)));

          if (available.length === 0) return;

          // Evento de Gol
          if (Math.random() < 0.007) {
            const scorer = available[Math.floor(Math.random() * available.length)];
            side === "home" ? homeScore++ : awayScore++;

            matchEvents.push({
              match_id: match.id,
              team_id: teamId,
              type: "GOAL",
              minute,
              player_id: scorer.id,
              // Sincronización con tabla match_events (snake_case)
              player_name: scorer.name,
              session_id: sessionId
            });
          }

          // Evento de Tarjetas
          if (Math.random() < 0.005) {
            const target = available[Math.floor(Math.random() * available.length)];
            const pId = String(target.id);
            yellowCardsCount[pId] = (yellowCardsCount[pId] || 0) + 1;

            const isRed = yellowCardsCount[pId] >= 2 || Math.random() < 0.1;
            if (isRed) expelledIds.add(pId);

            matchEvents.push({
              match_id: match.id,
              team_id: teamId,
              type: isRed ? "RED_CARD" : "YELLOW_CARD",
              minute,
              player_id: target.id,
              player_name: target.name,
              session_id: sessionId
            });
          }
        });
      }

      // 3. Actualizar la tabla física de 'matches'
      // Al actualizar 'matches', la vista 'league_table' se actualizará automáticamente
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_goals: homeScore,
          away_goals: awayScore,
          played: true
        })
        .eq("id", match.id);

      if (updateError) console.error(`Error actualizando partido ${match.id}:`, updateError);

      // 4. Inserción de eventos
      if (matchEvents.length > 0) {
        const { error: eventsError } = await supabase.from("match_events").insert(matchEvents);
        if (eventsError) console.error(`Error insertando eventos del partido ${match.id}:`, eventsError);
      }
    }

    return NextResponse.json({ ok: true, message: "Simulación completada con éxito" });
  } catch (err: any) {
    console.error("SIM ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}