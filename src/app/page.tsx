"use client";

import { useContext, useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Users, Calendar, Goal, X, ArrowUpRight, ArrowDownLeft, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatchResult } from '@/lib/types';

export default function DashboardPage() {
  const { 
    teams, players, matches, isLoaded, 
    getTeamById, lastPlayedWeek, getMatchEvents,
    season, nextSeason 
  } = useContext(LeagueContext);
  
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  // Evita errores de hidratación asegurando que el contenido cargue solo cuando los datos estén listos
  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  // Detecta si todos los partidos de la temporada actual han sido jugados
  const isSeasonFinished = useMemo(() => {
    const currentSeasonMatches = matches.filter(m => (m.season || 1) === (season || 1));
    return currentSeasonMatches.length > 0 && currentSeasonMatches.every(m => m.played);
  }, [matches, season]);

  // Estadísticas básicas con protección contra nulos
  const totalTeams = teams?.length || 0;
  const totalPlayers = players?.length || 0;
  
  // Suma de goles filtrada estrictamente por la temporada actual
  const totalGoals = useMemo(() => {
    return matches
      .filter(m => (m.season || 1) === (season || 1))
      .reduce((sum, m) => sum + (Number(m.home_goals) || 0) + (Number(m.away_goals) || 0), 0);
  }, [matches, season]);

  const stats = [
    { title: "Temporada", value: season || 1, icon: <FastForward className="h-5 w-5 text-orange-600" /> },
    { title: "Equipos", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jornada Actual", value: lastPlayedWeek || 1, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles (Temp)", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title={`Panel de Control - T${season || 1}`} 
          description="Resumen en tiempo real de la Liga Titán." 
        />
        
        {/* Botón único para avanzar de temporada al completar todas las jornadas */}
        {isSeasonFinished && (
          <Button 
            onClick={() => {
              nextSeason();
              toast.info(`¡Bienvenidos a la Temporada ${(season || 1) + 1}!`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs animate-bounce"
          >
            <FastForward className="mr-2 h-4 w-4" />
            Iniciar Siguiente Temporada
          </Button>
        )}
      </div>
      
      {/* Grid de Tarjetas Informativas */}
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

      {/* Componente que gestiona la lista de partidos y el botón inferior de simulación */}
      <DashboardClient onMatchClick={(match: MatchResult) => setSelectedMatch(match)} />

      {/* Modal Detalle de Partido (con scroll y protección de datos) */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <Card className="max-w-lg w-full shadow-2xl border-t-4 border-t-blue-600 relative overflow-hidden bg-white">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full z-10" 
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-6 bg-slate-50 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                Temporada {selectedMatch.season || 1} — Jornada {selectedMatch.round}
              </CardTitle>
              <div className="flex items-center justify-between px-4">
                <div className="flex-1 flex flex-col items-center">
                  <img src={getTeamById(selectedMatch.home_team)?.badge_url} className="h-14 w-14 object-contain" alt="" />
                  <p className="text-[10px] font-black uppercase mt-2 leading-tight text-center truncate w-full">
                    {getTeamById(selectedMatch.home_team)?.name}
                  </p>
                </div>
                <div className="px-5 py-1.5 bg-slate-900 text-white rounded-xl shadow-lg mx-2">
                  <span className="text-3xl font-black italic tracking-tighter">
                    {selectedMatch.home_goals} - {selectedMatch.away_goals}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <img src={getTeamById(selectedMatch.away_team)?.badge_url} className="h-14 w-14 object-contain" alt="" />
                  <p className="text-[10px] font-black uppercase mt-2 leading-tight text-center truncate w-full">
                    {getTeamById(selectedMatch.away_team)?.name}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 pb-8 px-6 max-h-[400px] overflow-y-auto bg-white relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2 hidden sm:block" />
              <div className="space-y-6 relative">
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  getMatchEvents(selectedMatch.id).map((event) => {
                    const isHome = String(event.team_id) === String(selectedMatch.home_team);
                    return (
                      <div key={event.id} className={`flex items-center w-full ${isHome ? 'justify-start' : 'justify-end'}`}>
                        <div className={`flex items-center gap-3 max-w-[48%] ${isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                          <span className="text-[9px] font-black text-slate-300 italic">{event.minute}'</span>
                          <div className="shrink-0">
                            {event.type === 'GOAL' && <span className="text-lg">⚽</span>}
                            {event.type === 'YELLOW_CARD' && <div className="w-3 h-4 bg-amber-400 rounded-sm border border-amber-500/20" />}
                            {event.type === 'RED_CARD' && <div className="w-3 h-4 bg-red-500 rounded-sm border border-red-600/20" />}
                            {event.type === 'SUBSTITUTION' && (
                              <div className="flex flex-col -space-y-1">
                                <ArrowUpRight className="w-3 h-3 text-green-500" />
                                <ArrowDownLeft className="w-3 h-3 text-red-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-black text-slate-800 truncate">
                              {event.player_name || event.playerName}
                            </span>
                            {event.type === 'GOAL' && (event.assist_name || event.assistName) && (
                              <span className="text-[9px] text-slate-400 font-bold italic">
                                Asist: {event.assist_name || event.assistName}
                              </span>
                            )}
                            {event.type === 'SUBSTITUTION' && (
                              <span className="text-[9px] text-red-400 font-bold italic">
                                Sale: {event.player_out_name || event.playerOutName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-300 italic text-[10px] font-bold uppercase tracking-widest opacity-50">
                    Sin eventos registrados
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