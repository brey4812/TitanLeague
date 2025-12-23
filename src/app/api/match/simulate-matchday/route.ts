import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // CORRECCIÓN: Tu frontend envía 'week', no 'matchday'
    const { divisionId, week } = await req.json();

    if (!divisionId || !week) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros: divisionId o week" }, 
        { status: 400 }
      );
    }

    // 1. Buscamos los partidos usando los nombres exactos de tu DB
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id")
      .eq("division_id", divisionId)
      .eq("round", week) // 'round' es tu columna para la jornada
      .eq("played", false);

    if (fetchError) throw fetchError;

    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: "No hay partidos pendientes para esta jornada." 
      });
    }

    // 2. Simulamos los resultados de forma masiva
    const simulationPromises = matches.map((match) => {
      const homeGoals = Math.floor(Math.random() * 5); 
      const awayGoals = Math.floor(Math.random() * 4); 

      return supabase
        .from("matches")
        .update({
          home_goals: homeGoals, // Nombre exacto de tu columna
          away_goals: awayGoals, // Nombre exacto de tu columna
          played: true,
          // Eliminamos updated_at si no estás seguro de que exista en tu tabla
        })
        .eq("id", match.id);
    });

    const results = await Promise.all(simulationPromises);
    
    const hasErrors = results.some(res => res.error);
    if (hasErrors) {
      const firstError = results.find(res => res.error)?.error;
      throw new Error(`Error en DB: ${firstError?.message}`);
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Simulación completada: ${matches.length} partidos procesados.` 
    });

  } catch (err: any) {
    console.error("Error en simulate-matchday:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}