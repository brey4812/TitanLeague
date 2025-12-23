import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { leagueId, divisionId, seasonId } = await req.json();

    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("division_id", divisionId);

    if (!teams || teams.length < 2) {
      return NextResponse.json({ ok: false, error: "Equipos insuficientes" });
    }

    const teamIds = teams.map(t => t.id);
    if (teamIds.length % 2 !== 0) teamIds.push(null as any);

    const totalRounds = teamIds.length - 1;
    const matchesPerRound = teamIds.length / 2;
    const matchesToCreate = [];

    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const home = teamIds[i];
        const away = teamIds[teamIds.length - 1 - i];

        if (home && away) {
          matchesToCreate.push({
            league_id: leagueId,
            division_id: divisionId,
            season_id: seasonId,
            home_team_id: home,
            away_team_id: away,
            week: round + 1,
            played: false,
            home_goals: 0,
            away_goals: 0,
            competition: "League"
          });
        }
      }
      teamIds.splice(1, 0, teamIds.pop()!);
    }

    const { error } = await supabase.from("matches").insert(matchesToCreate);
    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Calendario creado" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}