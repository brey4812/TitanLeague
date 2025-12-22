import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 👇 ESTE ES EL GET (para navegador)
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "API import/teams funcionando",
  });
}

// 👇 ESTE ES EL POST (para importar equipos)
export async function POST() {
  const apiKey = process.env.THESPORTSDB_API_KEY;

  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=English Premier League`
  );

  const data = await res.json();

  let inserted = 0;

  for (const t of data.teams ?? []) {
    const { error } = await supabase.from("teams").upsert({
      name: t.strTeam,
      external_id: t.idTeam,
      badge_url: t.strTeamBadge,
    });

    if (!error) inserted++;
  }

  return NextResponse.json({ inserted });
}
