"use client";

import { useContext } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Icons } from "@/components/icons";
import { LeagueContext } from '@/context/league-context';

export default function DashboardPage() {
  const { teams, players, matches, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) {
    return <div>Cargando...</div>;
  }
  
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const totalGoals = players.reduce((sum, player) => sum + player.stats.goals, 0);
  const currentWeek = matches.reduce((max, m) => Math.max(max, m.week), 0);

  const stats = [
    { title: "Equipos Totales", value: totalTeams, icon: <Icons.Teams className="h-6 w-6 text-muted-foreground" /> },
    { title: "Jugadores Totales", value: totalPlayers, icon: <Icons.Users className="h-6 w-6 text-muted-foreground" /> },
    { title: "Jornada Actual", value: currentWeek, icon: <Icons.Calendar className="h-6 w-6 text-muted-foreground" /> },
    { title: "Goles Totales", value: totalGoals, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-goal h-6 w-6 text-muted-foreground"><path d="M12 13V2l8 4-8 4"/><path d="M12 2L4 6l8 4"/><path d="M12 13v8"/><path d="M17 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M12 13h-8"/><path d="M12 13h8"/></svg> },
  ];

  return (
    <>
      <PageHeader
        title="Panel de Control"
        description="Bienvenido a la Liga Titán. Aquí tienes un resumen de la temporada actual."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardClient />
    </>
  );
}
