"use client";

import { useContext } from 'react';
import { LeagueContext } from '@/context/league-context';
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, Goal } from "lucide-react";

export default function DashboardPage() {
  const { teams, players, matches, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase tracking-tighter">
        Conectando con la Liga Titán...
      </div>
    );
  }

  // ESTADÍSTICAS AUTOMÁTICAS
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const totalGoals = matches.reduce((sum: number, m: any) => 
    sum + (m.home_goals || 0) + (m.away_goals || 0), 0);
  
  const rawRound = matches.length > 0 
    ? Math.max(...matches.map((m: any) => (m.round || 0))) 
    : 1;

  const stats = [
    { title: "Equipos", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jugadores", value: totalPlayers, icon: <Users className="h-5 w-5 text-green-600" /> },
    { title: "Jornada", value: rawRound, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* TARJETAS DE ESTADO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-2 border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PANEL DE RESULTADOS (DISEÑO TITAN) */}
      <DashboardClient />
    </div>
  );
}