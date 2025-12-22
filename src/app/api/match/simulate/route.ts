import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeTeam(team: any) {
  const attack = team.attack ?? 70;
  const midfield = team.midfield ?? 70;
  const defense = team.defense ?? 70;

  return {
    ...team,
    attack,
    midfield,
    defense,
    overall: Math.round((attack + midfield + defense) / 3),
  };
}

export async function POST(req: Request) {
  try {
    const { homeTeamId, awayTeamId } = await req.json();

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { ok: false, error: "Faltan IDs de equipos" },
        { status: 400 }
      );
    }

    // 🔹 HOME TEAM
    const { data: homeTeams, error: homeError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", homeTeamId)
      .limit(1);

    // 🔹 AWAY TEAM
    const { data: awayTeams, error: awayError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", awayTeamId)
      .limit(1);

    if (homeError || awayError || !homeTeams?.length || !awayTeams?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudieron obtener los equipos",
          debug: {
            homeError,
            awayError,
            homeFound: homeTeams?.length,
            awayFound: awayTeams?.length,
          },
        },
        { status: 500 }
      );
    }

    const home = normalizeTeam(homeTeams[0]);
    const away = normalizeTeam(awayTeams[0]);

    // ⚽ SIMULACIÓN BALANCEADA
    const homePower = home.overall * 1.08;
    const awayPower = away.overall;

    const randomness = Math.random() * 20 - 10;

    const homeGoals = Math.max(
      0,
      Math.round((homePower - awayPower + randomness) / 20 + Math.random() * 2)
    );

    const awayGoals = Math.max(
      0,
      Math.round((awayPower - homePower - randomness) / 20 + Math.random() * 2)
    );

    return NextResponse.json({
      ok: true,
      homeTeam: home.name,
      awayTeam: away.name,
      score: `${homeGoals} - ${awayGoals}`,
      stats: {
        homeOverall: home.overall,
        awayOverall: away.overall,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
