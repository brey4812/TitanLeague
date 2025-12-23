import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lista de IDs reales de TheSportsDB para la Primera División Española
const FORCED_TEAMS = [
  { id: "133738", league: "Spanish La Liga", name: "Real Madrid" },
  { id: "133739", league: "Spanish La Liga", name: "Barcelona" },
  { id: "133740", league: "Spanish La Liga", name: "Atlético Madrid" },
  { id: "133728", league: "Spanish La Liga", name: "Sevilla" },
  { id: "133735", league: "Spanish La Liga", name: "Villarreal" },
  { id: "133736", league: "Spanish La Liga", name: "Real Sociedad" },
  { id: "133729", league: "Spanish La Liga", name: "Real Betis" },
  { id: "133727", league: "Spanish La Liga", name: "Athletic Bilbao" },
  { id: "133731", league: "Spanish La Liga", name: "Valencia" },
  { id: "134700", league: "Spanish La Liga", name: "Girona" },
  { id: "133734", league: "Spanish La Liga", name: "Getafe" },
  { id: "133937", league: "Spanish La Liga", name: "Celta Vigo" },
  { id: "133737", league: "Spanish La Liga", name: "Osasuna" },
  { id: "134221", league: "Spanish La Liga", name: "Alavés" },
  { id: "133732", league: "Spanish La Liga", name: "Espanyol" },
  { id: "133918", league: "Spanish La Liga", name: "Mallorca" },
  { id: "133733", league: "Spanish La Liga", name: "Rayo Vallecano" },
  { id: "134384", league: "Spanish La Liga", name: "Valladolid" },
  { id: "133730", league: "Spanish La Liga", name: "Las Palmas" },
  { id: "134710", league: "Spanish La Liga", name: "Leganés" }
];

export async function POST() {
  try {
    const results = [];

    for (const teamInfo of FORCED_TEAMS) {
      // 1. Llamada a la API externa de TheSportsDB
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${teamInfo.id}`
      );
      const data = await response.json();
      const externalTeam = data.teams[0];

      if (!externalTeam) continue;

      // 2. Mapeo al formato de nuestra base de datos
      const teamData = {
        external_id: externalTeam.idTeam,
        name: externalTeam.strTeam,
        real_team_name: externalTeam.strTeam,
        badge_url: externalTeam.strBadge,
        country: externalTeam.strCountry,
        league: teamInfo.league,
        division_id: 1, // Forzamos Primera División
        attack: 75,
        midfield: 75,
        defense: 75,
        overall: 75,
        stats: { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
      };

      // 3. Upsert en Supabase (inserta o actualiza si ya existe)
      const { data: upsertedData, error } = await supabase
        .from("teams")
        .upsert(teamData, { onConflict: 'external_id' })
        .select();

      if (error) throw error;
      results.push(upsertedData[0]);
    }

    return NextResponse.json({
      ok: true,
      message: `${results.length} equipos sincronizados correctamente.`,
      data: results
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}