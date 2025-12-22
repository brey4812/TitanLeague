import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET() {
  try {
    const apiKey = process.env.THESPORTSDB_API_KEY || "1";

    const { data: teams, error } = await supabase
      .from("teams")
      .select("id, name, external_id")
      .not("external_id", "is", null);

    if (error) throw error;
    if (!teams || teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay equipos" });
    }

    let total = 0;
    const resumen: string[] = [];

    for (const team of teams) {
      await sleep(1200); // ⏳ EVITA EL 429

      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team.external_id}`
      );

      if (!res.ok) {
        resumen.push(`${team.name}: HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();
      if (!text.startsWith("{")) {
        resumen.push(`${team.name}: respuesta inválida`);
        continue;
      }

      const data = JSON.parse(text);
      if (!data.player) {
        resumen.push(`${team.name}: sin jugadores`);
        continue;
      }

      const players = data.player.map((p: any) => ({
        name: p.strPlayer,
        position: p.strPosition || "Unknown",
        team_id: team.id,
        rating: Math.floor(Math.random() * 16) + 72,
        goals: 0,
        assists: 0,
        clean_sheets: 0
      }));

      const { error: insertError } = await supabase
        .from("players")
        .upsert(players, {
          onConflict: "name,team_id"
        });

      if (insertError) {
        resumen.push(`${team.name}: DB ERROR`);
        continue;
      }

      total += players.length;
      resumen.push(`${team.name}: OK (${players.length})`);
    }

    return NextResponse.json({
      ok: true,
      total_jugadores: total,
      resumen
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
