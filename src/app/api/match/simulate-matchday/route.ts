import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicialización con SERVICE_ROLE_KEY para asegurar permisos de escritura
// El Service Role se salta las políticas RLS, permitiendo actualizar los resultados
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
    // Extraemos los parámetros necesarios
    const { divisionId, week, sessionId, seasonId } = body;

    if (!divisionId || !week || !sessionId) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // 1. Obtener partidos pendientes de la jornada específica
    // CORRECCIÓN: Usamos 'matchday' para filtrar, que es la columna real de tu DB
    let query = supabase
      .from("matches")
      .select("*")
      .eq("division_id", divisionId)
      .eq("matchday", week) 
      .eq("played", false)
      .eq("session_id", sessionId);

    // Filtro estricto por temporada si se proporciona
    if (seasonId) {
      query = query.eq("season_id", seasonId);
    }

    const { data: matches, error: matchError } = await query;

    if (matchError) throw matchError;

    // Si no hay partidos, devolvemos éxito pero informamos que no hubo nada que procesar
    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: `No se encontraron partidos pendientes para la jornada ${week}` 
      });
    }

    // 2. Obtener jugadores de los equipos involucrados en esta jornada
    const teamIds = matches.flatMap(m => [m.home_team, m.away_team]);
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, name")
      .in("team_id", teamIds);

    if (playerError) throw playerError;

    // 3. Procesar cada partido de la jornada
    for (const match of matches) {
      const matchEvents: any[] = [];
      const rosters: TeamData = {
        home: allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [],
        away: allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || []
      };

      // Simulación de alineación (tomamos los primeros 11 disponibles)
      const activePlayers: TeamData = {
        home: rosters.home.slice(0, 11),
        away: rosters.away.slice(0, 11)
      };

      let homeScore = 0;
      let awayScore = 0;

      // SIMULACIÓN LÓGICA DE 90 MINUTOS
      for (let minute = 1; minute <= 90; minute++) {
        (["home", "away"] as const).forEach(side => {
          const teamId = side === "home" ? match.home_team : match.away_team;
          const available = activePlayers[side];

          if (available.length === 0) return;

          // Evento de Gol: Probabilidad del 0.8% por minuto para cada equipo
          if (Math.random() < 0.008) {
            const scorer = available[Math.floor(Math.random() * available.length)];
            side === "home" ? homeScore++ : awayScore++;

            // Registramos el evento de gol con el nombre del jugador para la UI
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

      // 4. Actualizar el resultado del partido en Supabase
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_goals: homeScore,
          away_goals: awayScore,
          played: true
        })
        .eq("id", match.id);

      if (updateError) {
        console.error(`Error actualizando partido ${match.id}:`, updateError.message);
      }

      // 5. Insertar los goles generados en la tabla de eventos
      if (matchEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from("match_events")
          .insert(matchEvents);
          
        if (eventsError) {
          console.error(`Error insertando eventos del partido ${match.id}:`, eventsError.message);
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Jornada ${week} simulada correctamente. Resultados procesados.` 
    });

  } catch (err: any) {
    console.error("SIM ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}