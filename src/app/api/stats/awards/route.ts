import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  try {
    // Top Goleadores (Pichichi)
    const { data: scorers } = await supabase
      .from("players")
      .select("name, goals, teams(name, badge_url)")
      .gt("goals", 0)
      .order("goals", { ascending: false })
      .limit(5);

    // Top Asistentes
    const { data: assistants } = await supabase
      .from("players")
      .select("name, assists, teams(name, badge_url)")
      .gt("assists", 0)
      .order("assists", { ascending: false })
      .limit(5);

    // Guante de Oro (Clean Sheets)
    const { data: keepers } = await supabase
      .from("players")
      .select("name, clean_sheets, teams(name, badge_url)")
      .gt("clean_sheets", 0)
      .order("clean_sheets", { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: true,
      pichichi: scorers,
      asistentes: assistants,
      guante_oro: keepers
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}