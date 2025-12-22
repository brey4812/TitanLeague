import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") || "2";

    // Hacemos el join entre tournament_entries, competitions y teams
    const { data, error } = await supabase
      .from("tournament_entries")
      .select(`
        id,
        entry_reason,
        competition_id,
        competitions (
          name
        ),
        teams (
          name,
          badge_url
        )
      `)
      .eq("season_id", seasonId);

    if (error) {
      console.error("Error de Supabase:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}