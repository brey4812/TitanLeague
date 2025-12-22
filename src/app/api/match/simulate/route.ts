import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANTE: service role
);

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateGoals(strengthDiff: number) {
  if (strengthDiff > 20) return randomBetween(2, 4);
  if (strengthDiff > 10) return randomBetween(1, 3);
  if (strengthDiff > -10) return randomBetween(0, 2);
  if (strengthDiff > -20) return randomBetween(0, 1);
  return randomBetween(0, 1);
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

    // Obtener equipos
    const { data: teams, error } = await supabase
      .from("teams")
      .select("id, name, rating")
      .in("id", [homeTeamId, awayTeamId]);

    if (error || !teams || teams.length !== 2) {
      return NextResponse.json(
        { ok: false, error: "No se pudieron obtener los equipos" },
        { status: 500 }
      );
    }

    const home = teams.find(t => t.id === homeTeamId)!;
    const away = teams.find(t => t.id === awayTeamId)!;

    // Factores
    const homeForm = randomBetween(0, 10);
    const awayForm = randomBetween(0, 10);
    const randomnessHome = randomBetween(0, 15);
    const randomnessAway = randomBetween(0, 15);

    const homeStrength =
      home.rating * 0.6 + homeForm * 0.25 + randomnessHome + 5; // ventaja local
    const awayStrength =
      away.rating * 0.6 + awayForm * 0.25 + randomnessAway;

    const diff = homeStrength - awayStrength;

    const homeGoals = calculateGoals(diff);
    const awayGoals = calculateGoals(-diff);

    let winner = "draw";
    if (homeGoals > awayGoals) winner = home.name;
    if (awayGoals > homeGoals) winner = away.name;

    return NextResponse.json({
      ok: true,
      match: {
        home: home.name,
        away: away.name,
        score: `${homeGoals} - ${awayGoals}`,
        winner
      },
      debug: {
        homeStrength,
        awayStrength
      }
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
