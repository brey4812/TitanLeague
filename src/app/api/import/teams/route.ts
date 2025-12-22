import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY;

  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=English Premier League`
  );

  const data = await res.json();

  let updated = 0;

  for (const t of data.teams ?? []) {
    const { error } = await supabase
      .from("teams")
      .update({
        logo: t.strTeamBadge,
      })
      .ilike("name", t.strTeam);

    if (!error) updated++;
  }

  return NextResponse.json({ updated });
}
