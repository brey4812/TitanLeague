import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { teamId, name, position, rating } = await req.json();

    if (!teamId || !name || !position) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("players")
      .insert([{
        team_id: teamId,
        name: name,
        position: position,
        rating: rating || 60,
        goals: 0,
        assists: 0,
        clean_sheets: 0
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ ok: true, player: data[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}