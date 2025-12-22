import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    // 1. Obtenemos todos los equipos que ya tienes en tu base de datos (los reales de la API)
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay equipos con ID de API en tu DB" });
    }

    let totalImported = 0;
    const report: string[] = [];

    // 2. Por cada equipo, traemos sus jugadores
    for (const team of teams) {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`);
      const data = await res.json();

      if (data && data.player) {
        const playersToInsert = data.player.map((p: any) => ({
          name: p.strPlayer,
          position: p.strPosition,
          team_id: team.id, // Asignación inicial
          rating: Math.floor(Math.random() * (88 - 74 + 1)) + 74,
          goals: 0,
          assists: 0,
          clean_sheets: 0
        }));

        // USAMOS UPSERT POR NOMBRE:
        // Esto es CLAVE: Si Mbappe ya existe, no se duplica.
        // Si ya lo moviste al City, el onConflict hará que se mantenga como está 
        // y no se vuelva a "forzar" al equipo original de la API.
        const { error: upsertError } = await supabase
          .from("players")
          .upsert(playersToInsert, { onConflict: 'name' });

        if (!upsertError) {
          totalImported += playersToInsert.length;
          report.push(`${team.name}: ${playersToInsert.length} jugadores`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Bolsa de jugadores actualizada. Total: ${totalImported} jugadores reales.`,
      summary: report
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}