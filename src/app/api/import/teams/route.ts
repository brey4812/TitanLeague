import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔐 Supabase (SERVICE ROLE → solo en backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ⚽ Ligas europeas
const LEAGUES = [
  { league: "Spanish La Liga", country: "Spain" },
  { league: "English Premier League", country: "England" },
  { league: "German Bundesliga", country: "Germany" },
  { league: "French Ligue 1", country: "France" },
  { league: "Italian Serie A", country: "Italy" },
  { league: "Portuguese Primeira Liga", country: "Portugal" },
  { league: "Dutch Eredivisie", country: "Netherlands" },
];

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "THESPORTSDB_API_KEY no definida" },
      { status: 500 }
    );
  }

  let inserted = 0;
  let updated = 0;
  const details: any[] = [];

  for (const l of LEAGUES) {
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=${encodeURIComponent(
      l.league
    )}`;

    const res = await fetch(url);

    if (!res.ok) {
      details.push({ league: l.league, error: "Fetch failed" });
      continue;
    }

    const data = await res.json();

    if (!data.teams) {
      details.push({ league: l.league, error: "No teams found" });
      continue;
    }

    for (const t of data.teams) {
      const { data: result, error } = await supabase
        .from("teams")
        .upsert(
          {
            real_team_name: t.strTeam,
            logo: t.strTeamBadge,
          },
          { onConflict: "real_team_name" }
        )
        .select();

      if (error) {
        details.push({ team: t.strTeam, error: error.message });
      } else {
        if (result && result.length > 0) {
          updated++;
        } else {
          inserted++;
        }
      }
    }

    details.push({
      league: l.league,
      teams: data.teams.length,
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
