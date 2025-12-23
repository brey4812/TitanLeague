import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializamos Supabase con el Service Role Key para tener permisos de escritura
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIS_EQUIPOS_LALIGA = [
  { id: "133738", name: "Real Madrid" },
  { id: "133739", name: "Barcelona" },
  { id: "133728", name: "Sevilla" },
  { id: "133735", name: "Villarreal" },
  { id: "133736", name: "Real Sociedad" },
  { id: "133731", name: "Valencia" },
  { id: "133737", name: "Osasuna" },
  { id: "133918", name: "Mallorca" },
  { id: "133733", name: "Rayo Vallecano" },
  { id: "134384", name: "Valladolid" },
  { id: "133730", name: "Las Palmas" },
  { id: "134710", name: "Leganés" }
];

export async function GET() {
  const results = [];

  try {
    for (const equipo of MIS_EQUIPOS_LALIGA) {
      // 1. Obtener datos del equipo desde TheSportsDB
      const resT = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${equipo.id}`);
      const dataT = await resT.json();
      const t = dataT.teams[0];

      // 2. Obtener jugadores del equipo
      const resP = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${equipo.id}`);
      const dataP = await resP.json();
      
      // Mapear los primeros 20 jugadores
      const roster = (dataP.player || []).slice(0, 20).map((p: any) => ({
        name: p.strPlayer,
        nationality: p.strNationality || "Desconocida",
        position: p.strPosition?.includes("Goalkeeper") ? "Goalkeeper" : 
                  p.strPosition?.includes("Defender") ? "Defender" : 
                  p.strPosition?.includes("Midfielder") ? "Midfielder" : "Forward",
        rating: 80,
        image_url: p.strThumb || null,
        stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
      }));

      // 3. Insertar el equipo en tu base de datos de Supabase
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .upsert({
          id: parseInt(t.idTeam),
          name: t.strTeam,
          country: t.strCountry,
          badge_url: t.strTeamBadge,
          external_id: t.idTeam,
          overall: 80,
          attack: 80,
          midfield: 80,
          defense: 80,
          division_id: 1, // Todos en la misma división
          stats: { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
          roster: roster // Se guarda el JSON del roster completo
        })
        .select();

      if (teamError) throw teamError;
      results.push({ team: t.strTeam, status: "Importado", players: roster.length });
    }

    return NextResponse.json({
      success: true,
      message: "Importación masiva completada",
      details: results
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}