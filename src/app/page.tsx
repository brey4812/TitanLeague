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

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Cargando Panel de Control Titán...
      </div>
    );
  }
  
  // Lógica para detectar si la temporada actual ha terminado
  const isSeasonFinished = useMemo(() => {
    const currentSeasonMatches = matches.filter(m => (m.season || 1) === season);
    return currentSeasonMatches.length > 0 && currentSeasonMatches.every(m => m.played);
  }, [matches, season]);

  const totalTeams = teams.length;
  const totalPlayers = players.length;
  
  // Goles totales filtrados por temporada actual
  const totalGoals = matches
    .filter(m => (m.season || 1) === season)
    .reduce((sum: number, m: any) => sum + (m.home_goals || 0) + (m.away_goals || 0), 0);

  const stats = [
    { title: "Temporada", value: season, icon: <FastForward className="h-5 w-5 text-orange-600" /> },
    { title: "Equipos", value: totalTeams, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jornada Actual", value: lastPlayedWeek, icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles (Temp)", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title={`Panel de Control - T${season}`} description="Resumen en tiempo real de la Liga Titán." />
        
        {/* Solo dejamos el botón de Siguiente Temporada arriba si la actual terminó */}
        {isSeasonFinished && (
          <Button 
            onClick={() => {
              nextSeason();
              toast.info(`¡Bienvenidos a la Temporada ${season + 1}!`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs"
          >
            <FastForward className="mr-2 h-4 w-4" />
            Iniciar Siguiente Temporada
          </Button>
        )}
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

      {/* El DashboardClient contiene el botón de simulación de abajo que querías dejar */}
      <DashboardClient onMatchClick={(match: MatchResult) => setSelectedMatch(match)} />

      {/* Modal de resumen de partido */}
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
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 tracking-tighter">
                Temporada {selectedMatch.season || 1} - Jornada {selectedMatch.round}
              </CardTitle>
              <div className="flex items-center justify-between px-4">
                <div className="flex-1 flex flex-col items-center">
                  <img src={getTeamById(selectedMatch.home_team)?.badge_url} className="h-16 w-16 object-contain" alt="" />
                  <p className="text-[11px] font-black uppercase mt-2 leading-tight max-w-[100px] text-center">{getTeamById(selectedMatch.home_team)?.name}</p>
                </div>
                <div className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-lg">
                  <span className="text-4xl font-black italic tracking-tighter">
                    {selectedMatch.home_goals} - {selectedMatch.away_goals}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <img src={getTeamById(selectedMatch.away_team)?.badge_url} className="h-16 w-16 object-contain" alt="" />
                  <p className="text-[11px] font-black uppercase mt-2 leading-tight max-w-[100px] text-center">{getTeamById(selectedMatch.away_team)?.name}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 pb-10 px-6 max-h-[500px] overflow-y-auto bg-white relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2 hidden sm:block" />
              <div className="space-y-8 relative">
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  getMatchEvents(selectedMatch.id).map((event) => {
                    const isHomeEvent = String(event.team_id) === String(selectedMatch.home_team);
                    return (
                      <div key={event.id} className={`flex items-center w-full ${isHomeEvent ? 'justify-start' : 'justify-end'}`}>
                        <div className={`flex items-center gap-4 max-w-[48%] ${isHomeEvent ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                          <span className="text-[10px] font-black text-slate-400 italic min-w-[28px]">{event.minute}'</span>
                          <div className="shrink-0 z-10">
                            {event.type === 'GOAL' && <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-sm">⚽</div>}
                            {event.type === 'YELLOW_CARD' && <div className="w-3.5 h-5 bg-amber-400 rounded-[2px] shadow-sm border border-amber-500/20" />}
                            {event.type === 'RED_CARD' && <div className="w-3.5 h-5 bg-red-500 rounded-[2px] shadow-sm border border-red-600/20" />}
                            {event.type === 'SUBSTITUTION' && (
                              <div className="flex flex-col -space-y-1 items-center">
                                <ArrowUpRight className="w-4 h-4 text-green-500" />
                                <ArrowDownLeft className="w-4 h-4 text-red-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            {event.type === 'SUBSTITUTION' ? (
                              <>
                                <span className="text-xs font-black text-green-600 truncate tracking-tight">{event.player_name || event.playerName}</span>
                                <span className="text-[10px] text-red-400 font-bold truncate">{event.player_out_name || event.playerOutName}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-black text-slate-900 truncate tracking-tight">{event.player_name || event.playerName}</span>
                                {event.type === 'GOAL' && (
                                  <div className={`mt-0.5 ${isHomeEvent ? 'text-left' : 'text-right'}`}>
                                    {event.assist_name || event.assistName ? (
                                      <p className="text-[10px] text-slate-500 italic font-bold leading-none">Asist: {event.assist_name || event.assistName}</p>
                                    ) : (
                                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Sin asistencia</p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 italic text-sm font-bold uppercase tracking-widest opacity-40">Sin eventos destacados</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}