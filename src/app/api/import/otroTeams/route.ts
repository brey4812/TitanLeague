import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  const summary = [];

  try {
    for (const item of MIS_EQUIPOS_LALIGA) {
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${item.id}`);
      const data = await response.json();
      
      if (!data.teams) continue;
      const t = data.teams[0];

      // MAPEADO CORREGIDO
      const { error } = await supabase
        .from("teams")
        .upsert({
          id: parseInt(t.idTeam), // Clave primaria
          name: t.strTeam,
          real_team_name: t.strTeam, // Aquí es donde daba el error de duplicado
          country: t.strCountry,
          league: t.strLeague,
          badge_url: t.strTeamBadge,
          external_id: t.idTeam,
          division_id: 1,
          attack: 75,
          midfield: 75,
          defense: 75,
          overall: 75,
        }, { 
          // SOLUCIÓN AL ERROR: Le decimos a Supabase que ignore conflictos de nombres
          // y simplemente actualice los datos si el ID coincide.
          onConflict: 'id' 
        });

      if (error) {
        console.error(`Error con ${t.strTeam}:`, error.message);
        summary.push({ team: t.strTeam, status: "Error", detail: error.message });
      } else {
        summary.push({ team: t.strTeam, status: "Éxito" });
      }
    }

    return NextResponse.json({ success: true, details: summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}