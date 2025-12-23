import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EQUIPOS_LALIGA = [
  { id: "133738", name: "Real Madrid" }, { id: "133739", name: "Barcelona" },
  { id: "133728", name: "Sevilla" }, { id: "133735", name: "Villarreal" },
  { id: "133736", name: "Real Sociedad" }, { id: "133731", name: "Valencia" },
  { id: "133737", name: "Osasuna" }, { id: "133918", name: "Mallorca" },
  { id: "133733", name: "Rayo Vallecano" }, { id: "134384", name: "Valladolid" },
  { id: "133730", name: "Las Palmas" }, { id: "134710", name: "Leganés" }
];

export async function GET() {
  const summary = [];

  try {
    for (const equipo of EQUIPOS_LALIGA) {
      // 1. Obtener jugadores de la API externa
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${equipo.id}`);
      const data = await response.json();

      if (!data.player) {
        summary.push({ team: equipo.name, status: "Sin jugadores encontrados" });
        continue;
      }

      // 2. Mapear al formato de tu tabla 'players'
      const playersToInsert = data.player.slice(0, 20).map((p: any) => ({
        team_id: parseInt(equipo.id), // Vinculación con la tabla 'teams'
        name: p.strPlayer,
        // Normalización de posición para tu IA
        position: mapPosition(p.strPosition),
        // Rating aleatorio entre 70 y 90 (la API no lo da)
        rating: Math.floor(Math.random() * (90 - 70 + 1)) + 70,
        goals: 0,
        assists: 0,
        clean_sheets: 0,
        face_url: p.strThumb || null,
        nationality: p.strNationality || "Spain",
        country: null // Según tu tabla está como null habitualmente
      }));

      // 3. Upsert en la tabla 'players'
      const { error } = await supabase
        .from("players")
        .upsert(playersToInsert, { onConflict: 'name, team_id' });

      if (error) {
        summary.push({ team: equipo.name, status: "Error", detail: error.message });
      } else {
        summary.push({ team: equipo.name, status: "Éxito", count: playersToInsert.length });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fase 2: Importación de jugadores completada",
      details: summary
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Helper para que tu IA entienda las posiciones
function mapPosition(apiPos: string): string {
  const pos = apiPos.toLowerCase();
  if (pos.includes("goalkeeper")) return "Goalkeeper";
  if (pos.includes("defender") || pos.includes("back")) return "Defender";
  if (pos.includes("midfield")) return "Midfielder";
  if (pos.includes("forward") || pos.includes("striker") || pos.includes("wing")) return "Forward";
  return "Midfielder"; // Valor por defecto
}