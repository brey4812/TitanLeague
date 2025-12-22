import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function poisson(lambda: number) {
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, round } = await req.json();

    if (!leagueId || !round || !divisionId) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    // 1. Buscar partidos pendientes
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("league_id", leagueId)
      .eq("division_id", divisionId)
      .eq("round", round)
      .eq("played", false);

    if (matchError || !matches || matches.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay partidos para simular en esta jornada" }, { status: 404 });
    }

    for (const match of matches) {
      // 2. Obtener Stats de equipos (si son NULL, usamos 70 por defecto)
      const { data: teams } = await supabase
        .from("teams")
        .select("id, attack, defense, overall")
        .in("id", [match.home_team_id, match.away_team_id]);

      const home = teams?.find(t => t.id === match.home_team_id) || { attack: 70, defense: 70, overall: 70 };
      const away = teams?.find(t => t.id === match.away_team_id) || { attack: 70, defense: 70, overall: 70 };

      // 3. Simulación realista (Poisson)
      const homeAdv = 1.1;
      const hLambda = ((home.attack + home.overall) / 2 - away.defense * 0.7) / 30 * homeAdv;
      const aLambda = ((away.attack + away.overall) / 2 - home.defense * 0.7) / 32;
      
      let hG = Math.max(0, poisson(Math.max(0.2, hLambda)));
      let aG = Math.max(0, poisson(Math.max(0.2, aLambda)));

      // Azar extra
      if (Math.random() < 0.1) hG += rand(0, 1);
      if (Math.random() < 0.1) aG += rand(0, 1);

      // 4. Guardar resultado del partido
      await supabase.from("matches").update({
        home_goals: hG,
        away_goals: aG,
        played: true
      }).eq("id", match.id);

      // 5. Actualizar Standings para ambos equipos
      const updates = [
        { id: match.home_team_id, gf: hG, ga: aG, w: hG > aG ? 1 : 0, d: hG === aG ? 1 : 0, l: hG < aG ? 1 : 0 },
        { id: match.away_team_id, gf: aG, ga: hG, w: aG > hG ? 1 : 0, d: aG === hG ? 1 : 0, l: aG < hG ? 1 : 0 }
      ];

      for (const res of updates) {
        const pts = res.w * 3 + res.d;
        
        // Buscamos si ya tiene fila en standings
        const { data: current } = await supabase
          .from("standings")
          .select("*")
          .eq("team_id", res.id)
          .eq("season_id", match.season_id)
          .single();

        if (current) {
          await supabase.from("standings").update({
            played: current.played + 1,
            wins: current.wins + res.w,
            draws: current.draws + res.d,
            losses: current.losses + res.l,
            goals_for: current.goals_for + res.gf,
            goals_against: current.goals_against + res.ga,
            points: current.points + pts
          }).eq("id", current.id);
        } else {
          await supabase.from("standings").insert({
            team_id: res.id,
            season_id: match.season_id,
            played: 1,
            wins: res.w,
            draws: res.d,
            losses: res.l,
            goals_for: res.gf,
            goals_against: res.ga,
            points: pts
          });
        }
      }
    }

    return NextResponse.json({ ok: true, message: `Jornada ${round} simulada con éxito` });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}