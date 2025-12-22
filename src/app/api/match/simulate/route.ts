import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// utilidades
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function poisson(lambda: number) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export async function POST(req: Request) {
  try {
    const { leagueId, round } = await req.json();

    if (!leagueId || !round) {
      return NextResponse.json(
        { ok: false, error: "leagueId y round son obligatorios" },
        { status: 400 }
      );
    }

    // 1️⃣ obtener partidos de esa jornada
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id")
      .eq("league_id", leagueId)
      .eq("round", round)
      .eq("played", false);

    if (matchError || !matches || matches.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No hay partidos para simular" },
        { status: 404 }
      );
    }

    let simulated = 0;

    for (const match of matches) {
      // 2️⃣ obtener equipos
      const { data: teams } = await supabase
        .from("teams")
        .select("id, attack, defense, overall")
        .in("id", [match.home_team_id, match.away_team_id]);

      if (!teams || teams.length !== 2) continue;

      const home = teams.find(t => t.id === match.home_team_id)!;
      const away = teams.find(t => t.id === match.away_team_id)!;

      // 3️⃣ balance realista
      const homeAdvantage = 1.1;

      const homeLambda =
        ((home.attack + home.overall) / 2 -
          away.defense * 0.7) / 30 * homeAdvantage;

      const awayLambda =
        ((away.attack + away.overall) / 2 -
          home.defense * 0.7) / 32;

      let homeGoals = Math.max(0, poisson(Math.max(0.2, homeLambda)));
      let awayGoals = Math.max(0, poisson(Math.max(0.2, awayLambda)));

      // 4️⃣ azar controlado (sorpresas)
      if (Math.random() < 0.15) {
        homeGoals += rand(0, 2);
      }
      if (Math.random() < 0.15) {
        awayGoals += rand(0, 2);
      }

      // 5️⃣ guardar resultado
      await supabase
        .from("matches")
        .update({
          home_goals: homeGoals,
          away_goals: awayGoals,
          played: true
        })
        .eq("id", match.id);

      simulated++;
    }

    return NextResponse.json({
      ok: true,
      simulated
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
