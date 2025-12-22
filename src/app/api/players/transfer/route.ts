import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  try {
    const { playerId, newTeamId } = await req.json();

    if (!playerId || !newTeamId) {
      return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    // Simplemente actualizamos el team_id del jugador
    const { data, error } = await supabase
      .from("players")
      .update({ team_id: newTeamId })
      .eq("id", playerId)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      ok: true, 
      message: "Jugador transferido con éxito",
      player: data[0] 
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}