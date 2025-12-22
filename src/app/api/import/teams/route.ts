import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ligas europeas que quieres importar
const LEAGUES = [
  { name: "Spanish La Liga", query: "Spanish La Liga" },
  { name: "English Premier League", query: "English Premier League" },
  { name: "German Bundesliga", query: "German Bundesliga" },
  { name: "French Ligue 1", query: "French Ligue 1" },
  { name: "Italian Serie A", query: "Italian Serie A" },
  { name: "Portuguese Primeira Liga", query: "Portuguese Primeira Liga" },
  { name: "Dutch Eredivisie", query: "Dutch Eredivisie" },
];

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing THESPORTSDB_API_KEY" },
      { status: 500 }
    );
  }

  let inserted = 0;
  let updated = 0;
  const details: any[] = [];

  for (const league of LEAGUES) {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=${encodeURIComponent(
        league.query
      )}`
    );

    const data = await res.json();

    if (!data?.teams) {
      details.push({ league: league.name, teams: 0 });
      continue;
    }

    for (const t of data.teams.slice(0, 10)) {
      const { error } = await supabase.from("teams").upsert(
        {
          name: t.strTeam,              // obligatorio (NO NULL)
          real_team_name: t.strTeam,    // nombre real
          external_id: t.idTeam,        // id TheSportsDB
          badge_url: t.strBadge,        // escudo
          country: t.strCountry ?? null,
        },
        {
          onConflict: "real_team_name",
        }
      );

      if (error) {
        details.push({ team: t.strTeam, error: error.message });
      } else {
        inserted++; // Supabase decide si es insert o update
      }
    }

    details.push({
      league: league.name,
      teams: Math.min(data.teams.length, 10),
    });
  }

  return NextResponse.json({
    ok: true,
    leagues: LEAGUES.length,
    inserted,
    updated,
    details,
  });
}
