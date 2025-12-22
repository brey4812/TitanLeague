import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Genera un número aleatorio con peso
 */
function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/**
 * Simula un partido balanceado
 */
function simulateMatch(home: any, away: any) {
  const homeRating =
    home.attack * 0.4 +
    home.midfield * 0.35 +
    home.defense * 0.25

  const awayRating =
    away.attack * 0.4 +
    away.midfield * 0.35 +
    away.defense * 0.25

  // ventaja de local
  const homeAdvantage = 3

  const diff = homeRating + homeAdvantage - awayRating

  let homeGoals = 0
  let awayGoals = 0

  // goles base
  homeGoals = Math.max(0, Math.round(random(0, 1.8 + diff / 20)))
  awayGoals = Math.max(0, Math.round(random(0, 1.6 - diff / 25)))

  // sorpresas (el fútbol es fútbol)
  if (Math.random() < 0.15) {
    homeGoals += Math.round(random(-1, 1))
    awayGoals += Math.round(random(-1, 1))
  }

  // nunca negativos
  homeGoals = Math.max(0, homeGoals)
  awayGoals = Math.max(0, awayGoals)

  return {
    homeGoals,
    awayGoals,
  }
}

export async function POST(req: Request) {
  try {
    const { homeTeamId, awayTeamId } = await req.json()

    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .in("id", [homeTeamId, awayTeamId])

    if (error || !teams || teams.length !== 2) {
      return NextResponse.json(
        { ok: false, error: "Equipos no encontrados" },
        { status: 400 }
      )
    }

    const home = teams.find(t => t.id === homeTeamId)
    const away = teams.find(t => t.id === awayTeamId)

    const result = simulateMatch(home, away)

    return NextResponse.json({
      ok: true,
      homeTeam: home.name,
      awayTeam: away.name,
      ...result,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Error simulando partido" },
      { status: 500 }
    )
  }
}
