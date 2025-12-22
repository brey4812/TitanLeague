import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function poisson(lambda: number) {
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, round } = await req.json();

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("division_id", divisionId)
      .eq("round", round)
      .eq("played", false);

    if (!matches || matches.length === 0) return NextResponse.json({ ok: false, error: "No hay partidos" });

    for (const match of matches) {
      const { data: teams } = await supabase.from("teams").select("*").in("id", [match.home_team, match.away_team]);
      const home = teams?.find(t => t.id === match.home_team) || { attack: 70, defense: 70, overall: 70 };
      const away = teams?.find(t => t.id === match.away_team) || { attack: 70, defense: 70, overall: 70 };

      const hG = poisson(((home.attack + home.overall) / 2 - away.defense * 0.7) / 30 * 1.1);
      const aG = poisson(((away.attack + away.overall) / 2 - home.defense * 0.7) / 32);

      await supabase.from("matches").update({ home_goals: hG, away_goals: aG, played: true }).eq("id", match.id);

      const res = [
        { id: match.home_team, gf: hG, ga: aG, w: hG > aG ? 1 : 0, d: hG === aG ? 1 : 0, l: hG < aG ? 1 : 0 },
        { id: match.away_team, gf: aG, ga: hG, w: aG > hG ? 1 : 0, d: aG === hG ? 1 : 0, l: aG < hG ? 1 : 0 }
      ];

      for (const t of res) {
        const { data: cur } = await supabase.from("standings").select("*").eq("team_id", t.id).eq("season_id", match.season_id).single();
        if (cur) {
          await supabase.from("standings").update({
            played: cur.played + 1, wins: cur.wins + t.w, draws: cur.draws + t.d, losses: cur.losses + t.l,
            goals_for: cur.goals_for + t.gf, goals_against: cur.goals_against + t.ga, points: cur.points + (t.w * 3 + t.d)
          }).eq("id", cur.id);
        } else {
          await supabase.from("standings").insert({
            team_id: t.id, season_id: match.season_id, played: 1, wins: t.w, draws: t.d, losses: t.l,
            goals_for: t.gf, goals_against: t.ga, points: (t.w * 3 + t.d)
          });
        }
      }
    }
    return NextResponse.json({ ok: true, message: "Simulación completada" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}