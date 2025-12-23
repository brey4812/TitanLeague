import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get("divisionId");
    const seasonId = searchParams.get("seasonId") || "1";

    if (!divisionId) {
      return NextResponse.json(
        { ok: false, error: "divisionId es requerido" },
        { status: 400 }
      );
    }

    // 1. Obtener todos los equipos de la división (para asegurar que salgan aunque tengan 0 puntos)
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, badge_url")
      .eq("division_id", divisionId);

    if (teamsError) throw teamsError;

    // 2. Obtener todos los partidos jugados de esta temporada y división
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("division_id", divisionId)
      .eq("season_id", seasonId)
      .eq("played", true);

    if (matchesError) throw matchesError;

    // 3. Objeto temporal para calcular las estadísticas
    const standingsMap: Record<number, any> = {};

    teams.forEach((team) => {
      standingsMap[team.id] = {
        team_id: team.id,
        name: team.name,
        badge_url: team.badge_url,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      };
    });

    // 4. Procesar los resultados de los partidos
    matches.forEach((m) => {
      const home = standingsMap[m.home_team_id];
      const away = standingsMap[m.away_team_id];

      if (home && away) {
        home.played++;
        away.played++;
        home.goals_for += m.home_goals;
        home.goals_against += m.away_goals;
        away.goals_for += m.away_goals;
        away.goals_against += m.home_goals;

        if (m.home_goals > m.away_goals) {
          home.won++;
          home.points += 3;
          away.lost++;
        } else if (m.home_goals < m.away_goals) {
          away.won++;
          away.points += 3;
          home.lost++;
        } else {
          home.drawn++;
          away.drawn++;
          home.points += 1;
          away.points += 1;
        }
      }
    });

    // 5. Convertir a array y ordenar (Puntos > Diferencia Goles > Goles Favor)
    const finalStandings = Object.values(standingsMap).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goals_for - a.goals_against;
      const diffB = b.goals_for - b.goals_against;
      if (diffB !== diffA) return diffB - diffA;
      return b.goals_for - a.goals_for;
    });

    return NextResponse.json({
      ok: true,
      standings: finalStandings
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}