"use client";

import { useContext } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Icons } from "@/components/icons";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Users, Calendar, Goal } from "lucide-react";

export default function DashboardPage() {
  const { teams, players, matches, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground italic">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  // Calculamos los goles totales sumando los golesFor de cada equipo en la liga
  const totalGoals = teams.reduce((sum, team) => sum + (team.stats.goalsFor || 0), 0);
  const currentWeek = matches.length > 0 ? Math.max(...matches.map(m => m.week)) : 0;

  const stats = [
    { title: "Equipos Totales", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jugadores Totales", value: totalPlayers, icon: <Users className="h-5 w-5 text-green-600" /> },
    { title: "Jornada Actual", value: currentWeek, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles Totales", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Panel de Control"
        description="Bienvenido a la Liga Titán. Resumen en tiempo real de tu base de datos y competición."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <DashboardClient />
    </div>
  );
}