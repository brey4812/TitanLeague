import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LEAGUES = [
  { name: "Spanish La Liga", query: "Spanish La Liga" },
];

const FORCED_TEAMS = [
  { id: "133738", league: "Spanish La Liga", name: "Real Madrid" },
  { id: "133739", league: "Spanish La Liga", name: "Barcelona" },
  { id: "133740", league: "Spanish La Liga", name: "Atlético Madrid" },
  { id: "133728", league: "Spanish La Liga", name: "Sevilla" },
  { id: "133735", league: "Spanish La Liga", name: "Villarreal" },
  { id: "133736", league: "Spanish La Liga", name: "Real Sociedad" },
  { id: "133729", league: "Spanish La Liga", name: "Real Betis" },
  { id: "133727", league: "Spanish La Liga", name: "Athletic Bilbao" },
  { id: "133731", league: "Spanish La Liga", name: "Valencia" },
  { id: "134700", league: "Spanish La Liga", name: "Girona" },
  { id: "133734", league: "Spanish La Liga", name: "Getafe" },
  { id: "133937", league: "Spanish La Liga", name: "Celta Vigo" },
  { id: "133737", league: "Spanish La Liga", name: "Osasuna" },
  { id: "134221", league: "Spanish La Liga", name: "Alavés" },
  { id: "133732", league: "Spanish La Liga", name: "Espanyol" },
  { id: "133918", league: "Spanish La Liga", name: "Mallorca" },
  { id: "133733", league: "Spanish La Liga", name: "Rayo Vallecano" },
  { id: "134384", league: "Spanish La Liga", name: "Valladolid" },
  { id: "133730", league: "Spanish La Liga", name: "Las Palmas" },
  { id: "134710", league: "Spanish La Liga", name: "Leganés" }
];

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY || "1";
  let inserted = 0;

  // 🔹 1. Importación normal (los 10 que da la API)
  for (const league of LEAGUES) {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=${encodeURIComponent(
        league.query
      )}`
    );

    const data = await res.json();
    if (!data?.teams) continue;

    for (const t of data.teams) {
      await supabase.from("teams").upsert(
        {
          name: t.strTeam,
          real_team_name: t.strTeam,
          external_id: t.idTeam,
          badge_url: t.strBadge,
          country: t.strCountry,
          league: league.name,
        },
        { onConflict: "external_id" }
      );
      inserted++;
    }
  }

  // 🔹 2. Importación FORZADA (equipos grandes)
  for (const team of FORCED_TEAMS) {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupteam.php?id=${team.id}`
    );
    const data = await res.json();
    if (!data?.teams?.[0]) continue;

    const t = data.teams[0];

    await supabase.from("teams").upsert(
      {
        name: t.strTeam,
        real_team_name: t.strTeam,
        external_id: t.idTeam,
        badge_url: t.strBadge,
        country: t.strCountry,
        league: team.league,
      },
      { onConflict: "external_id" }
    );
    inserted++;
  }

  return NextResponse.json({
    ok: true,
    inserted,
  });
}
