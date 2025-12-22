import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    // 1. Obtenemos TODOS los equipos que ya tienes en tu base de datos
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No se encontraron equipos con ID de API" });
    }

    let totalImported = 0;
    const report = [];

    // 2. Buscamos los jugadores para cada uno de esos equipos
    for (const team of teams) {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`);
      const data = await res.json();

      if (data && data.player) {
        const playersToInsert = data.player.map((p: any) => ({
          team_id: team.id, // Se asigna a este equipo al inicio
          name: p.strPlayer,
          position: p.strPosition,
          // Rating aleatorio para que el simulador tenga datos con qué trabajar
          rating: Math.floor(Math.random() * (88 - 72 + 1)) + 72,
          goals: 0,
          assists: 0,
          clean_sheets: 0
        }));

        // USAMOS UPSERT POR NOMBRE:
        // Si el jugador ya existe (ej. Mbappé ya está en la DB), el 'onConflict'
        // evitará que se cree un duplicado. Así, si tú lo moviste de equipo 
        // manualmente antes de ejecutar esto, NO se sobreescribirá su equipo.
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
      message: `Importación masiva terminada. ${totalImported} jugadores en el sistema.`,
      details: report
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}