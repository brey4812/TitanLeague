"use client";

import { useContext, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Users, Calendar, Goal, Zap, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatchResult } from '@/lib/types';

export default function DashboardPage() {
  const { teams, players, matches, isLoaded, divisions, refreshData, getMatchEvents, getTeamById } = useContext(LeagueContext);
  const [isSimulatingAll, setIsSimulatingAll] = useState(false);
  
  // ESTADO PARA EL MODAL DE DETALLES
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const totalGoals = matches.reduce((sum: number, m: any) => sum + (m.home_goals || 0) + (m.away_goals || 0), 0);
  
  const rawRound = matches.length > 0 
    ? Math.max(...matches.map((m: any) => (m.round || 0))) 
    : 1;

  const handleSimulateAll = async () => {
    setIsSimulatingAll(true);
    try {
      const divisionIds = divisions.map((d: any) => d.id);
      for (const divId of divisionIds) {
        const res = await fetch("/api/match/simulate-matchday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ divisionId: divId, week: rawRound }), // Cambiado matchday por week para coincidir con tu API
        });
        if (!res.ok) throw new Error(`Error en división ${divId}`);
      }
      toast.success("¡Jornada simulada en todas las divisiones!");
      if (refreshData) await refreshData(); 
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsSimulatingAll(false);
    }
  };

  const stats = [
    { title: "Equipos", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jugadores", value: totalPlayers, icon: <Users className="h-5 w-5 text-green-600" /> },
    { title: "Jornada", value: rawRound, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Panel de Control" description="Resumen en tiempo real de la Liga Titán." />
        <Button 
          onClick={handleSimulateAll} 
          disabled={isSimulatingAll || teams.length === 0}
          variant="outline"
          className="bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100 font-black uppercase text-xs"
        >
          {isSimulatingAll ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4 fill-amber-500" />}
          Simular Todas las Divisiones
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-2 border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent><div className="text-3xl font-black">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Pasamos el setter al DashboardClient para capturar el clic en los partidos */}
      <DashboardClient onMatchClick={(match: MatchResult) => setSelectedMatch(match)} />

      {/* MODAL DE DETALLES DE PARTIDO (SUCESOS Y ASISTENCIAS) */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl border-t-4 border-t-blue-600 relative overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full" 
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-2 bg-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-tighter text-slate-400">Resumen del Partido</CardTitle>
              <div className="flex items-center justify-between mt-4 gap-2">
                <div className="flex-1 text-center">
                  <img src={getTeamById(selectedMatch.home_team)?.badge_url} className="h-14 w-14 mx-auto object-contain" />
                  <p className="text-[10px] font-black uppercase mt-1 leading-tight">{getTeamById(selectedMatch.home_team)?.name}</p>
                </div>
                <div className="text-4xl font-black italic tracking-tighter bg-slate-200 px-4 py-1 rounded-lg">
                  {selectedMatch.home_goals} - {selectedMatch.away_goals}
                </div>
                <div className="flex-1 text-center">
                  <img src={getTeamById(selectedMatch.away_team)?.badge_url} className="h-14 w-14 mx-auto object-contain" />
                  <p className="text-[10px] font-black uppercase mt-1 leading-tight">{getTeamById(selectedMatch.away_team)?.name}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  getMatchEvents(selectedMatch.id).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 text-sm border-b border-slate-50 pb-2">
                      <div className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded italic">
                        {event.minute}'
                      </div>
                      <div className="flex-1">
                        <span className="font-bold">{event.playerName}</span>
                        {event.type === 'GOAL' && <span className="ml-2">⚽</span>}
                        {event.type === 'YELLOW_CARD' && <span className="ml-2">🟨</span>}
                        {event.type === 'RED_CARD' && <span className="ml-2">🟥</span>}
                        
                        {/* MUESTRA DE ASISTENCIAS SI EXISTEN */}
                        {event.type === 'GOAL' && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5 font-medium uppercase">
                            Sin asistencia registrada
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-sm font-medium">
                    No hubo eventos destacados en este partido.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}