import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Definimos interfaces para evitar errores de tipo "any"
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
    const { divisionId, week, sessionId } = await req.json();

    if (!divisionId || !week || !sessionId) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros" }, { status: 400 });
    }

    const { data: matches } = await supabase.from("matches").select("*")
      .eq("division_id", divisionId).eq("round", week).eq("played", false).eq("session_id", sessionId);

    if (!matches || matches.length === 0) return NextResponse.json({ ok: true, message: "No hay partidos" });

    const teamIds = matches.flatMap(m => [m.home_team, m.away_team]);
    const { data: allPlayers } = await supabase.from("players").select("id, team_id, name").in("team_id", teamIds);

    for (const match of matches) {
      const matchEvents: any[] = [];
      
      // Especificamos el tipo TeamData para que acepte claves "home" | "away"
      const rosters: TeamData = {
        home: allPlayers?.filter(p => String(p.team_id) === String(match.home_team)) || [],
        away: allPlayers?.filter(p => String(p.team_id) === String(match.away_team)) || []
      };

      const activePlayers: TeamData = { 
        home: rosters.home.slice(0, 11), 
        away: rosters.away.slice(0, 11) 
      };
      
      const bench: TeamData = { 
        home: rosters.home.slice(11, 16), 
        away: rosters.away.slice(11, 16) 
      };

      const expelledIds = new Set<string>();
      const yellowCardsCount: Record<string, number> = {};
      let homeScore = 0;
      let awayScore = 0;

      for (let minute = 1; minute <= 90; minute++) {
        // Lógica de Cambios
        if (minute >= 60 && minute % 10 === 0) {
          (["home", "away"] as const).forEach((side) => {
            if (bench[side].length > 0 && Math.random() < 0.3) {
              const playerIn = bench[side].shift();
              const playerOutIndex = activePlayers[side].findIndex(p => !expelledIds.has(String(p.id)));
              if (playerIn && playerOutIndex !== -1) {
                activePlayers[side][playerOutIndex] = playerIn;
              }
            }
          });
        }

        (["home", "away"] as const).forEach((side) => {
          // Goles
          if (Math.random() < 0.006) { 
            const available = activePlayers[side].filter(p => !expelledIds.has(String(p.id)));
            if (available.length > 0) {
              const scorer = available[Math.floor(Math.random() * available.length)];
              let assist_name = null;
              
              if (Math.random() < 0.7 && available.length > 1) {
                assist_name = available.find(p => p.id !== scorer.id)?.name || null;
              }

              side === "home" ? homeScore++ : awayScore++;
              matchEvents.push({
                match_id: match.id, player_id: scorer.id, player_name: scorer.name,
                assist_name, type: "GOAL", minute, session_id: sessionId
              });
            }
          }

          // Tarjetas y Sanciones
          if (Math.random() < 0.004) {
            const available = activePlayers[side].filter(p => !expelledIds.has(String(p.id)));
            if (available.length > 0) {
              const target = available[Math.floor(Math.random() * available.length)];
              const pId = String(target.id);
              yellowCardsCount[pId] = (yellowCardsCount[pId] || 0) + 1;

              if (yellowCardsCount[pId] === 2 || Math.random() < 0.1) {
                expelledIds.add(pId);
                matchEvents.push({
                  match_id: match.id, player_id: target.id, player_name: target.name,
                  type: "RED_CARD", minute, session_id: sessionId
                });
              } else {
                matchEvents.push({
                  match_id: match.id, player_id: target.id, player_name: target.name,
                  type: "YELLOW_CARD", minute, session_id: sessionId
                });
              }
            }
          }
        });
      }

      await supabase.from("matches").update({
        home_goals: homeScore, away_goals: awayScore, played: true
      }).eq("id", match.id);

      if (matchEvents.length > 0) {
        await supabase.from("match_events").insert(matchEvents);
      }
    }

    return NextResponse.json({ ok: true, message: "Simulación completada" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}