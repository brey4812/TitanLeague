import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  try {
    const { teamId, divisionId, attack, defense, overall } = await req.json();

    if (!teamId) return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });

    const { data, error } = await supabase
      .from("teams")
      .update({
        division_id: divisionId,
        attack: attack || 70,
        defense: defense || 70,
        overall: overall || 70
      })
      .eq("id", teamId)
      .select();

    if (error) throw error;

    return NextResponse.json({ ok: true, team: data[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}