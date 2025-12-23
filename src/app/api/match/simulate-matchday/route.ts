import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { divisionId, matchday } = await req.json();

    // 1. Buscamos los partidos de esa división y jornada que no se han jugado
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id")
      .eq("division_id", divisionId)
      .eq("week", matchday) // O 'matchday' según tu tabla
      .eq("played", false);

    if (fetchError || !matches) throw new Error("No se encontraron partidos");

    // 2. Simulamos cada partido llamando a tu lógica de simulación
    // (Aquí puedes simplificar o llamar internamente a tu otro endpoint)
    for (const match of matches) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/match/simulate`, {
        method: "POST",
        body: JSON.stringify({ matchId: match.id }),
      });
    }

    return NextResponse.json({ ok: true, message: `Simulada división ${divisionId}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}