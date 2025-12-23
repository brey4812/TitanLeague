"use client";

import { useContext, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Users, Calendar, Goal, Zap, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const { teams, players, matches, isLoaded, divisions, refreshData, resetLeagueData } = useContext(LeagueContext);
  const [isSimulatingAll, setIsSimulatingAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground italic">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  // ESTADÍSTICAS EN TIEMPO REAL
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  
  // Sumamos los goles de todos los partidos jugados en la base de datos
  const totalGoals = matches.reduce((sum: number, m: any) => 
    sum + (m.home_goals || 0) + (m.away_goals || 0), 0);
  
  // JORNADA ACTUAL: Buscamos el valor más alto en la columna 'round'
  const rawRound = matches.length > 0 
    ? Math.max(...matches.map((m: any) => (m.round || 0))) 
    : 0;
  const currentRound = rawRound > 0 ? rawRound : 1;

  // FUNCIÓN PARA GENERAR CALENDARIO
  const handleGenerateAll = async () => {
    if (matches.length > 0) {
      const confirmGen = confirm("Ya existen partidos. ¿Deseas borrar los actuales y generar un nuevo calendario?");
      if (!confirmGen) return;
    }

    setIsGenerating(true);
    try {
      const divisionIds = divisions.map((d: any) => d.id);
      
      // Llamamos al generador por cada división
      for (const divId of divisionIds) {
        const res = await fetch("/api/match/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            divisionId: divId,
            leagueId: 1,
            seasonId: 1 
          }),
        });
        if (!res.ok) throw new Error(`Error generando División ${divId}`);
      }
      
      toast.success("¡Calendarios generados con éxito!");
      if (refreshData) await refreshData(); // Recargamos datos sin refrescar pantalla
    } catch (error: any) {
      toast.error("Error al generar: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // FUNCIÓN PARA SIMULAR TODAS LAS DIVISIONES
  const handleSimulateAll = async () => {
    setIsSimulatingAll(true);
    try {
      const divisionIds = divisions.map((d: any) => d.id);
      
      for (const divId of divisionIds) {
        const res = await fetch("/api/match/simulate-matchday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            divisionId: divId, 
            matchday: currentRound 
          }),
        });
        if (!res.ok) throw new Error(`Error simulando División ${divId}`);
      }
      
      toast.success(`Jornada ${currentRound} simulada en todas las divisiones`);
      if (refreshData) await refreshData(); 
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsSimulatingAll(false);
    }
  };

  const stats = [
    { title: "Equipos Totales", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jugadores Totales", value: totalPlayers, icon: <Users className="h-5 w-5 text-green-600" /> },
    { title: "Jornada Actual", value: currentRound, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles Totales", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Panel de Control" description="Administración central de la Liga Titán." />
        
        <div className="flex flex-wrap gap-2">
          {/* BOTÓN: REINICIAR LIGA (Si existe en tu contexto) */}
          <Button 
            onClick={() => resetLeagueData?.()} 
            variant="ghost" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Reset
          </Button>

          {/* BOTÓN: GENERAR CALENDARIO */}
          <Button 
            onClick={handleGenerateAll}
            disabled={isGenerating || teams.length === 0}
            variant="secondary"
            className="font-bold border-2 border-slate-200"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Generar Calendarios
          </Button>

          {/* BOTÓN: SIMULAR TODO */}
          <Button 
            onClick={handleSimulateAll} 
            disabled={isSimulatingAll || matches.length === 0}
            variant="outline"
            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold border-2"
          >
            {isSimulatingAll ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4 fill-amber-500" />}
            Simular Jornada {currentRound}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-2 border-slate-200 hover:border-slate-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent><div className="text-3xl font-black">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <DashboardClient />
    </div>
  );
}