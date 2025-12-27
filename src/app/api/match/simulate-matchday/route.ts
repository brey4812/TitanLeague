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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- NORMALIZACIÓN DE PARÁMETROS ---
    const week = Number(body.week);
    const sessionId = String(body.sessionId || body.session);
    let seasonId = Number(body.seasonId || body.season);
    const divisionId = body.divisionId;
    const leagueId = Number(body.leagueId || 1);

    // --- AUTO-RECUPERACIÓN DE TEMPORADA ---
    if (!seasonId) {
      const { data: activeSeason } = await supabase
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (activeSeason) {
        seasonId = activeSeason.id;
      } else {
        seasonId = 1;
      }
    }

    // 1. Validaciones iniciales
    if (!week || !sessionId || !seasonId) {
      return NextResponse.json({
        ok: false,
        error: "Faltan parámetros críticos (week, session o season)",
        received: { week, sessionId, seasonId }
      }, { status: 400 });
    }

    // 2. Bloqueo de seguridad: jornadas previas
    if (week > 1) {
      const { data: pending } = await supabase
        .from("matches")
        .select("id")
        .eq("session_id", sessionId)
        .eq("season_id", seasonId)
        .lt("matchday", week)
        .eq("played", false)
        .limit(1);

      if (pending && pending.length > 0) {
        return NextResponse.json({
          ok: false,
          error: "Existen jornadas anteriores sin completar."
        }, { status: 400 });
      }
    }

    // 3. Obtener sancionados
    let sanctionedIds = new Set<string>();
    if (week > 1) {
      const { data: prevM } = await supabase
        .from("matches")
        .select("id")
        .eq("matchday", week - 1)
        .eq("season_id", seasonId)
        .eq("session_id", sessionId);

      const ids = prevM?.map(m => m.id) || [];
      
      if (ids.length > 0) {
        const { data: evs } = await supabase
          .from("match_events")
          .select("player_id")
          .eq("session_id", sessionId)
          .in("type", ["RED_CARD", "SECOND_YELLOW"])
          .in("match_id", ids);

        evs?.forEach(e => sanctionedIds.add(String(e.player_id)));
      }
    }

    // 4. Obtener partidos
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
        message: "No hay partidos pendientes."
      });
    }

    // 5. Obtener jugadores
    const teamIds = Array.from(new Set(matches.flatMap(m => [m.home_team, m.away_team])));
    const { data: allPlayers, error: pError } = await supabase
      .from("players")
      .select("id, team_id, name, position")
      .in("team_id", teamIds);

    if (pError) throw pError;

    // 6. Simulación de partidos
    for (const match of matches) {
      const currentMatchEvents: any[] = [];

      const homeRoster = allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [];
      const awayRoster = allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || [];

      let activeHome = homeRoster.filter(p => !sanctionedIds.has(String(p.id))).slice(0, 11);
      let activeAway = awayRoster.filter(p => !sanctionedIds.has(String(p.id))).slice(0, 11);

      let benchHome = homeRoster.slice(11);
      let benchAway = awayRoster.slice(11);

      const yellowCards: Record<string, number> = {};
      let homeGoals = 0;
      let awayGoals = 0;

      for (let min = 1; min <= 90; min++) {
        ["home", "away"].forEach(side => {
          const teamId = (side === "home") ? match.home_team : match.away_team;
          let actives = (side === "home") ? activeHome : activeAway;
          let bench = (side === "home") ? benchHome : benchAway;

          if (actives.length === 0) return;

          // Lógica de Goles (0.75% probabilidad por minuto)
          if (Math.random() < 0.0075) {
            const scorerIdx = Math.floor(Math.random() * actives.length);
            const scorer = actives[scorerIdx];

            if (side === "home") {
              homeGoals++;
            } else {
              awayGoals++;
            }

            currentMatchEvents.push({
              match_id: match.id,
              team_id: teamId,
              type: "GOAL",
              minute: min,
              player_id: scorer.id,
              player_name: scorer.name,
              session_id: sessionId
            });

            // Lógica de Asistencias (70% de probabilidad)
            if (Math.random() < 0.7 && actives.length > 1) {
              const others = actives.filter(p => p.id !== scorer.id);
              const asst = others[Math.floor(Math.random() * others.length)];

              currentMatchEvents.push({
                match_id: match.id,
                team_id: teamId,
                type: "ASSIST",
                minute: min,
                player_id: asst.id,
                player_name: asst.name,
                session_id: sessionId
              });
            }
          }

          // Lógica de Tarjetas (0.2% probabilidad por minuto)
          if (Math.random() < 0.002) {
            const targetIdx = Math.floor(Math.random() * actives.length);
            const target = actives[targetIdx];

            if (Math.random() < 0.15) {
              // Roja directa
              currentMatchEvents.push({
                match_id: match.id,
                team_id: teamId,
                type: "RED_CARD",
                minute: min,
                player_id: target.id,
                player_name: target.name,
                session_id: sessionId
              });

              if (side === "home") {
                activeHome = activeHome.filter(p => p.id !== target.id);
              } else {
                activeAway = activeAway.filter(p => p.id !== target.id);
              }
            } else {
              // Amarilla
              yellowCards[target.id] = (yellowCards[target.id] || 0) + 1;

              if (yellowCards[target.id] === 2) {
                currentMatchEvents.push({
                  match_id: match.id,
                  team_id: teamId,
                  type: "SECOND_YELLOW",
                  minute: min,
                  player_id: target.id,
                  player_name: target.name,
                  session_id: sessionId
                });

                if (side === "home") {
                  activeHome = activeHome.filter(p => p.id !== target.id);
                } else {
                  activeAway = activeAway.filter(p => p.id !== target.id);
                }
              } else {
                currentMatchEvents.push({
                  match_id: match.id,
                  team_id: teamId,
                  type: "YELLOW_CARD",
                  minute: min,
                  player_id: target.id,
                  player_name: target.name,
                  session_id: sessionId
                });
              }
            }
          }

          // Lógica de Cambios
          if (min > 60 && min < 85 && Math.random() < 0.01 && bench.length > 0) {
            const pOutIdx = Math.floor(Math.random() * actives.length);
            const pOut = actives[pOutIdx];
            const pIn = bench[0];

            currentMatchEvents.push({
              match_id: match.id,
              team_id: teamId,
              type: "SUBSTITUTION",
              minute: min,
              player_id: pIn.id,
              player_name: pIn.name,
              assist_name: pOut.name,
              session_id: sessionId
            });

            if (side === "home") {
              activeHome = [...activeHome.filter(p => p.id !== pOut.id), pIn];
              benchHome = benchHome.slice(1);
            } else {
              activeAway = [...activeAway.filter(p => p.id !== pOut.id), pIn];
              benchAway = benchAway.slice(1);
            }
          }
        });
      }

      // Lógica de Portería a Cero (Clean Sheet)
      if (awayGoals === 0) {
        const gk = homeRoster.find(p => 
          p.position?.toLowerCase().includes("goalkeeper") || 
          p.position === "GK"
        );
        if (gk) {
          currentMatchEvents.push({
            match_id: match.id,
            team_id: match.home_team,
            type: "CLEAN_SHEET",
            minute: 90,
            player_id: gk.id,
            player_name: gk.name,
            session_id: sessionId
          });
        }
      }

      if (homeGoals === 0) {
        const gk = awayRoster.find(p => 
          p.position?.toLowerCase().includes("goalkeeper") || 
          p.position === "GK"
        );
        if (gk) {
          currentMatchEvents.push({
            match_id: match.id,
            team_id: match.away_team,
            type: "CLEAN_SHEET",
            minute: 90,
            player_id: gk.id,
            player_name: gk.name,
            session_id: sessionId
          });
        }
      }

      // 7. Actualizar Partido
      await supabase
        .from("matches")
        .update({
          home_goals: homeGoals,
          away_goals: awayGoals,
          played: true,
          league_id: leagueId
        })
        .eq("id", match.id);

      // Inserción de Eventos (Compatibilidad exacta con columnas player_name y assist_name)
      if (currentMatchEvents.length > 0) {
        const { error: insError } = await supabase
          .from("match_events")
          .insert(currentMatchEvents);
        
        if (insError) {
          console.error("Error insertando eventos:", insError.message);
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Jornada ${week} simulada con éxito.` 
    });

  } catch (err: any) {
    console.error("SIM ERROR:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message 
    }, { status: 500 });
  }
}