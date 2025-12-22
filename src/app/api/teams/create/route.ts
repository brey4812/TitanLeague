import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, divisionId, country, badge_url, attack, defense } = await req.json();

    if (!name) return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });

    const { data, error } = await supabase
      .from("teams")
      .insert([
        {
          name: name,
          real_team_name: name,
          division_id: divisionId || null,
          country: country || "Custom",
          badge_url: badge_url || "https://placeholder.com/150",
          attack: attack || 70,
          defense: defense || 70,
          overall: Math.floor(((attack || 70) + (defense || 70)) / 2),
          external_id: null // Para diferenciarlo de los de la API
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json({ ok: true, team: data[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}