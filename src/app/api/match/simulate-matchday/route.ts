import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usamos la Service Role Key para tener permisos de escritura sin restricciones
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { divisionId, matchday } = await req.json();

    if (!divisionId || !matchday) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros: divisionId o matchday" }, { status: 400 });
    }

    // 1. Buscamos los partidos de esa división y jornada que no se han jugado
    // IMPORTANTE: Usamos 'round' porque es el nombre que confirmamos en tu tabla 'matches'
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id")
      .eq("division_id", divisionId)
      .eq("round", matchday) 
      .eq("played", false);

    if (fetchError) throw fetchError;

    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: "No hay partidos pendientes para esta jornada." });
    }

    // 2. Simulamos los resultados de forma masiva
    // Iteramos sobre los partidos encontrados para generar scores aleatorios
    const simulationPromises = matches.map((match) => {
      const homeGoals = Math.floor(Math.random() * 5); // 0 a 4 goles
      const awayGoals = Math.floor(Math.random() * 4); // 0 a 3 goles

      return supabase
        .from("matches")
        .update({
          home_goals: homeGoals,
          away_goals: awayGoals,
          played: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", match.id);
    });

    // Ejecutamos todas las actualizaciones en paralelo para mayor velocidad
    const results = await Promise.all(simulationPromises);
    
    // Verificamos si hubo errores en alguna actualización
    const hasErrors = results.some(res => res.error);
    if (hasErrors) throw new Error("Error al actualizar algunos resultados.");

    return NextResponse.json({ 
      ok: true, 
      message: `Simulación completada: ${matches.length} partidos procesados en División ${divisionId}` 
    });

  } catch (err: any) {
    console.error("Error en simulate-matchday:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}