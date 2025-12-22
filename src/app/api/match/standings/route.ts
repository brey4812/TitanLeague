import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get("divisionId");
    const seasonId = searchParams.get("seasonId");

    if (!divisionId || !seasonId) {
      return NextResponse.json(
        { ok: false, error: "divisionId y seasonId son requeridos" },
        { status: 400 }
      );
    }

    // Consultamos la tabla de standings unida con la de teams para tener los nombres/logos
    const { data, error } = await supabase
      .from("standings")
      .select(`
        *,
        teams (
          name,
          badge_url
        )
      `)
      .eq("season_id", seasonId)
      .eq("teams.division_id", divisionId) // Filtramos por la división del equipo
      .order("points", { ascending: false })
      .order("goals_for", { ascending: false }); // Criterio de desempate

    if (error) throw error;

    // Filtrar resultados nulos (por si hay equipos en standings que no pertenecen a esa división)
    const filteredData = data.filter((item: any) => item.teams !== null);

    return NextResponse.json({
      ok: true,
      standings: filteredData
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}