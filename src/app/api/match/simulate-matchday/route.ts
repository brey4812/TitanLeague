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
  position?: string;
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

    // 3. Obtener jugadores sancionados (Roja o Doble Amarilla en la jornada anterior)
    const { data: sanctionedEvents } = await supabase
      .from("match_events")
      .select("player_id")
      .eq("session_id", sessionId)
      .in("type", ["RED_CARD", "SECOND_YELLOW"])
      .filter("match_id", "in", (
        supabase.from("matches").select("id").eq("matchday", week - 1).eq("season_id", seasonId)
      ));
    
    const sanctionedIds = new Set(sanctionedEvents?.map(e => String(e.player_id)) || []);

    // 4. Construcción de la consulta de partidos
    let query = supabase
      .from("matches")
      .select("*")
      .eq("matchday", week) 
      .eq("played", false)
      .eq("season_id", seasonId)
      .eq("session_id", sessionId);

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

    // 5. Obtener jugadores
    const teamIds = Array.from(new Set(matches.flatMap(m => [m.home_team, m.away_team])));
    const { data: allPlayers, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, name, position")
      .in("team_id", teamIds);

    if (playerError) throw playerError;

    // 6. Procesar cada partido
    for (const match of matches) {
      const matchEvents: any[] = [];
      
      const rosters = {
        home: allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [],
        away: allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || []
      };

      // Jugadores disponibles (quitando sancionados)
      const availableHome = rosters.home.filter(p => !sanctionedIds.has(String(p.id)));
      const availableAway = rosters.away.filter(p => !sanctionedIds.has(String(p.id)));

      // Jugadores en el campo iniciales (11)
      let activeHome = availableHome.slice(0, 11);
      let activeAway = availableAway.slice(0, 11);
      
      // Suplentes para cambios
      let benchHome = availableHome.slice(11);
      let benchAway = availableAway.slice(11);
      
      const yellowCardsRecord: Record<string, number> = {};
      let homeScore = 0;
      let awayScore = 0;

      // Simulación de 90 minutos
      for (let minute = 1; minute <= 90; minute++) {
        (["home", "away"] as const).forEach(side => {
          const teamId = side === "home" ? match.home_team : match.away_team;
          let currentActives = side === "home" ? activeHome : activeAway;
          let currentBench = side === "home" ? benchHome : benchAway;

          if (currentActives.length === 0) return;

          // --- LÓGICA DE GOLES Y ASISTENCIAS ---
          if (Math.random() < 0.0075) {
            const scorerIdx = Math.floor(Math.random() * currentActives.length);
            const scorer = currentActives[scorerIdx];
            side === "home" ? homeScore++ : awayScore++;

            matchEvents.push({
              match_id: match.id, team_id: teamId, type: "GOAL", minute,
              player_id: scorer.id, player_name: scorer.name, session_id: sessionId
            });

            // Asistencia (70%)
            if (Math.random() < 0.7 && currentActives.length > 1) {
              const otherPlayers = currentActives.filter(p => p.id !== scorer.id);
              const assistant = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
              matchEvents.push({
                match_id: match.id, team_id: teamId, type: "ASSIST", minute,
                player_id: assistant.id, player_name: assistant.name, session_id: sessionId
              });
            }
          }

          // --- LÓGICA DE TARJETAS Y EXPULSIONES ---
          if (Math.random() < 0.002) {
            const targetIdx = Math.floor(Math.random() * currentActives.length);
            const target = currentActives[targetIdx];
            const isRed = Math.random() < 0.15;

            if (isRed) {
              matchEvents.push({
                match_id: match.id, team_id: teamId, type: "RED_CARD", minute,
                player_id: target.id, player_name: target.name, session_id: sessionId
              });
              if (side === "home") activeHome = activeHome.filter(p => p.id !== target.id);
              else activeAway = activeAway.filter(p => p.id !== target.id);
            } else {
              const currentYellows = (yellowCardsRecord[target.id] || 0) + 1;
              yellowCardsRecord[target.id] = currentYellows;

              if (currentYellows === 2) {
                matchEvents.push({
                  match_id: match.id, team_id: teamId, type: "SECOND_YELLOW", minute,
                  player_id: target.id, player_name: target.name, session_id: sessionId
                });
                if (side === "home") activeHome = activeHome.filter(p => p.id !== target.id);
                else activeAway = activeAway.filter(p => p.id !== target.id);
              } else {
                matchEvents.push({
                  match_id: match.id, team_id: teamId, type: "YELLOW_CARD", minute,
                  player_id: target.id, player_name: target.name, session_id: sessionId
                });
              }
            }
          }

          // --- LÓGICA DE CAMBIOS (Minuto 60 al 85) ---
          if (minute > 60 && minute < 85 && Math.random() < 0.01) {
            if (currentBench.length > 0 && currentActives.length > 0) {
              const playerOut = currentActives[Math.floor(Math.random() * currentActives.length)];
              const playerIn = currentBench[0]; // Sale el primer suplente

              matchEvents.push({
                match_id: match.id, team_id: teamId, type: "SUB", minute,
                player_name: playerIn.name, // El que entra
                assist_name: playerOut.name, // El que sale (usado para visualización)
                player_id: playerIn.id,
                session_id: sessionId
              });

              // Actualizar listas
              if (side === "home") {
                activeHome = [...activeHome.filter(p => p.id !== playerOut.id), playerIn];
                benchHome = benchHome.filter(p => p.id !== playerIn.id);
              } else {
                activeAway = [...activeAway.filter(p => p.id !== playerOut.id), playerIn];
                benchAway = benchAway.filter(p => p.id !== playerIn.id);
              }
            }
          }
        });
      }

      // --- LÓGICA DE PORTERÍA A CERO (Solo portero) ---
      if (awayScore === 0) {
        const goalkeeper = availableHome.find(p => p.position === "Goalkeeper");
        if (goalkeeper) {
          matchEvents.push({ 
            match_id: match.id, team_id: match.home_team, type: "CLEAN_SHEET", 
            minute: 90, player_id: goalkeeper.id, player_name: goalkeeper.name, session_id: sessionId 
          });
        }
      }
      if (homeScore === 0) {
        const goalkeeper = availableAway.find(p => p.position === "Goalkeeper");
        if (goalkeeper) {
          matchEvents.push({ 
            match_id: match.id, team_id: match.away_team, type: "CLEAN_SHEET", 
            minute: 90, player_id: goalkeeper.id, player_name: goalkeeper.name, session_id: sessionId 
          });
        }
      }

      // 7. Actualizar Match
      const { error: updateError } = await supabase
        .from("matches")
        .update({ home_goals: homeScore, away_goals: awayScore, played: true })
        .eq("id", match.id);

      if (updateError) console.error(`Error match ${match.id}:`, updateError.message);

      // 8. Insertar Eventos
      if (matchEvents.length > 0) {
        const { error: eventsError } = await supabase.from("match_events").insert(matchEvents);
        if (eventsError) console.error(`Error eventos:`, eventsError.message);
      }
    }

    return NextResponse.json({ ok: true, message: `Jornada ${week} procesada exitosamente.` });

  } catch (err: any) {
    console.error("SIM ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}