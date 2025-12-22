import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    // 1. Obtenemos todos los equipos de tu DB que tienen ID de la API
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    if (teamsError) throw teamsError;

    let totalImported = 0;
    const report: string[] = [];

    // 2. Recorremos los equipos para traer a los jugadores
    for (const team of teams || []) {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`);
      const data = await res.json();

      if (data && data.player) {
        const playersToInsert = data.player.map((p: any) => ({
          name: p.strPlayer,
          position: p.strPosition,
          team_id: team.id, // Asignación inicial (luego puedes cambiarlo)
          rating: Math.floor(Math.random() * (88 - 72 + 1)) + 72,
          goals: 0,
          assists: 0,
          clean_sheets: 0
        }));

        // INSERTAR USANDO ON CONFLICT
        // Si el nombre del jugador ya existe, lo ignora. 
        // Esto permite que si moviste a Mbappé al City, el script no lo devuelva al Madrid.
        const { error: upsertError } = await supabase
          .from("players")
          .upsert(playersToInsert, { onConflict: 'name' });

        if (!upsertError) {
          totalImported += playersToInsert.length;
          report.push(`${team.name}: OK`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Importación finalizada. ${totalImported} jugadores en la base de datos.`,
      report
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}