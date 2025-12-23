"use client";

import { useContext, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Users, Calendar, Goal, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const { teams, players, matches, isLoaded, divisions } = useContext(LeagueContext);
  const [isSimulatingAll, setIsSimulatingAll] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground italic">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const totalGoals = teams.reduce((sum: number, team: any) => sum + (team.stats?.goalsFor || 0), 0);
  
  // CORRECCIÓN DE ERRORES: Usamos (m: any) para evitar fallos de tipos
  const rawWeek = matches.length > 0 
    ? Math.max(...matches.map((m: any) => (m.week || m.matchday || 0))) 
    : 0;
  const currentWeek = rawWeek > 0 ? rawWeek : 1;

  const handleSimulateAll = async () => {
    setIsSimulatingAll(true);
    try {
      const divisionIds = divisions.map((d: any) => d.id);
      for (const divId of divisionIds) {
        const res = await fetch("/api/match/simulate-matchday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ divisionId: divId, matchday: currentWeek }),
        });
        if (!res.ok) throw new Error(`Error en división ${divId}`);
      }
      toast.success("¡Jornada simulada en todas las divisiones!");
      window.location.reload(); 
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsSimulatingAll(false);
    }
  };

  const stats = [
    { title: "Equipos Totales", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jugadores Totales", value: totalPlayers, icon: <Users className="h-5 w-5 text-green-600" /> },
    { title: "Jornada Actual", value: currentWeek, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles Totales", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Panel de Control" description="Resumen en tiempo real de la Liga Titán." />
        <Button 
          onClick={handleSimulateAll} 
          disabled={isSimulatingAll || teams.length === 0}
          variant="outline"
          className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
        >
          {isSimulatingAll ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4 fill-amber-500" />}
          Simular Todas las Divisiones
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-2">
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