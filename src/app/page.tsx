"use client";

import { useContext, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy, Calendar, Goal, X, FastForward, AlertTriangle, ShieldCheck, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatchResult } from "@/lib/types";

export default function DashboardPage() {
  const {
    teams,
    matches,
    isLoaded,
    getTeamById,
    lastPlayedWeek,
    getMatchEvents,
    season, // Este es el número de temporada (1, 2...)
    nextSeason,
  } = useContext(LeagueContext);

  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  /* =======================
      SANEAMIENTO Y LÓGICA GLOBAL CORREGIDA
     ======================= */
  const safeTeams = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);
  const safeMatches = useMemo(() => (Array.isArray(matches) ? matches : []), [matches]);
  
  // Usamos el valor que viene del contexto para filtrar
  const currentSeasonNum = Number(season || 1);

  // CORRECCIÓN: Filtrar partidos usando season_id para coincidir con la DB
  const isGlobalSeasonFinished = useMemo(() => {
    if (!isLoaded || safeMatches.length === 0) return false;
    
    const currentSeasonMatches = safeMatches.filter(
      (m) => m.competition === "League" && 
      (Number(m.season_id) === currentSeasonNum || Number(m.season) === currentSeasonNum)
    );
    
    if (currentSeasonMatches.length === 0) return false;
    return currentSeasonMatches.every((m) => m.played === true);
  }, [safeMatches, currentSeasonNum, isLoaded]);

  // CORRECCIÓN: Cálculo de goles filtrando correctamente por la temporada activa
  const totalGoals = useMemo(() => {
    if (!isLoaded) return 0;
    return safeMatches
      .filter((m) => 
        m.played && 
        (Number(m.season_id) === currentSeasonNum || Number(m.season) === currentSeasonNum)
      )
      .reduce((sum, m) => sum + (Number(m.home_goals) || 0) + (Number(m.away_goals) || 0), 0);
  }, [safeMatches, currentSeasonNum, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase tracking-widest">
        Sincronizando con Liga Titán...
      </div>
    );
  }

  const stats = [
    { title: "Temporada", value: currentSeasonNum, icon: <FastForward className="h-5 w-5 text-orange-600" /> },
    { title: "Equipos Totales", value: safeTeams.length, icon: <Trophy className="h-5 w-5 text-blue-600" /> },
    { title: "Jornada Actual", value: Number(lastPlayedWeek || 1), icon: <Calendar className="h-5 w-5 text-purple-600" /> },
    { title: "Goles (Temp)", value: totalGoals, icon: <Goal className="h-5 w-5 text-red-600" /> },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "GOAL": return <div className="w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm">⚽</div>;
      case "YELLOW_CARD": return <div className="w-3 h-4 bg-yellow-400 rounded-sm border border-yellow-500 shadow-sm" />;
      case "RED_CARD":
      case "SECOND_YELLOW": return <div className="w-3 h-4 bg-red-500 rounded-sm border border-red-600 shadow-sm" />;
      case "SUBSTITUTION":
      case "SUB": return (
        <div className="flex flex-col -space-y-1">
          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          <ArrowDownLeft className="w-3 h-3 text-red-500" />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      
      {isGlobalSeasonFinished && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 p-6 rounded-xl shadow-2xl mb-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-emerald-400 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
              <ShieldCheck className="w-10 h-10 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Temporada {currentSeasonNum} Completada</h2>
              <p className="text-emerald-100 text-sm font-medium">Todas las divisiones han finalizado sus calendarios.</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              if (currentSeasonNum >= 10) {
                toast.error("Has alcanzado el límite de 10 temporadas.");
                return;
              }
              nextSeason();
              toast.success(`¡Iniciando los preparativos de la Temporada ${currentSeasonNum + 1}!`);
            }}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-black uppercase px-10 py-6 rounded-lg shadow-xl transition-all hover:scale-105"
          >
            Cerrar Temporada {currentSeasonNum}
          </Button>
        </div>
      )}

      <PageHeader
        title={`Panel de Control - T${currentSeasonNum}`}
        description="Resumen en tiempo real de la Liga Titán."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardClient onMatchClick={setSelectedMatch} />

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all">
          <Card className="max-w-xl w-full relative shadow-2xl border-2 border-slate-800 animate-in zoom-in-95 duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-slate-100 rounded-full z-10"
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center border-b bg-slate-50/50 pb-6">
              <div className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Resumen del Encuentro</div>
              <div className="flex items-center justify-around gap-4">
                <div className="flex-1 flex flex-col items-center">
                   <p className="text-lg font-black uppercase italic leading-tight">{getTeamById(selectedMatch.home_team)?.name}</p>
                </div>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-2xl font-black italic tracking-tighter shadow-lg">
                  {selectedMatch.home_goals} : {selectedMatch.away_goals}
                </div>
                <div className="flex-1 flex flex-col items-center">
                   <p className="text-lg font-black uppercase italic leading-tight">{getTeamById(selectedMatch.away_team)?.name}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="py-0 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-slate-100">
                <div className="py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Eventos del Partido</div>
                
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  [...getMatchEvents(selectedMatch.id)]
                  .sort((a, b) => Number(a.minute) - Number(b.minute))
                  .map((event) => {
                    const isHome = String(event.team_id) === String(selectedMatch.home_team);
                    // Normalización de nombres para mostrar en UI
                    const pName = event.playerName || event.player_name;
                    const aName = event.assistName || event.assist_name;

                    return (
                      <div key={event.id || Math.random()} className="grid grid-cols-3 items-center py-4 px-2 hover:bg-slate-50/50 transition-colors">
                        {/* Lado Local */}
                        <div className={`flex items-center gap-3 ${isHome ? "justify-end" : "invisible"}`}>
                           <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-slate-800 leading-none">{pName}</span>
                              {(aName || event.type === 'SUBSTITUTION' || event.type === 'SUB') && (
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                  { (event.type === 'SUBSTITUTION' || event.type === 'SUB') ? `por ${aName}` : `Asist: ${aName}`}
                                </span>
                              )}
                           </div>
                           {getEventIcon(event.type)}
                        </div>

                        {/* Minuto Central */}
                        <div className="flex justify-center">
                          <span className="bg-slate-100 text-slate-500 text-[11px] font-black px-2 py-1 rounded-md min-w-[35px] text-center border border-slate-200">
                            {event.minute}'
                          </span>
                        </div>

                        {/* Lado Visitante */}
                        <div className={`flex items-center gap-3 ${!isHome ? "justify-start" : "invisible"}`}>
                           {getEventIcon(event.type)}
                           <div className="flex flex-col items-start">
                              <span className="text-sm font-black text-slate-800 leading-none">{pName}</span>
                              {(aName || event.type === 'SUBSTITUTION' || event.type === 'SUB') && (
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                  {(event.type === 'SUBSTITUTION' || event.type === 'SUB') ? `por ${aName}` : `Asist: ${aName}`}
                                </span>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2 opacity-40">
                    <AlertTriangle className="w-10 h-10" />
                    <p className="italic text-sm font-black uppercase tracking-widest">Sin eventos registrados</p>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50/50 border-t text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fin del tiempo reglamentario</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}