"use client";

import { useContext, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy, Calendar, Goal, X, FastForward, AlertTriangle, ShieldCheck } from "lucide-react";
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
    season,
    nextSeason,
  } = useContext(LeagueContext);

  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  /* =======================
      SANEAMIENTO Y LÓGICA GLOBAL
     ======================= */
  const safeTeams = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);
  const safeMatches = useMemo(() => (Array.isArray(matches) ? matches : []), [matches]);
  const currentSeasonNum = Number(season || 1);

  // BLOQUEO DE SEGURIDAD GLOBAL: 
  // Solo es true si TODOS los partidos de liga de la temporada actual están jugados
  const isGlobalSeasonFinished = useMemo(() => {
    if (!isLoaded || safeMatches.length === 0) return false;

    const currentSeasonMatches = safeMatches.filter(
      (m) => m.competition === "League" && Number(m.season_id || m.season) === currentSeasonNum
    );

    if (currentSeasonMatches.length === 0) return false;

    // Verificamos que absolutamente todos los partidos programados tengan played: true
    return currentSeasonMatches.every((m) => m.played === true);
  }, [safeMatches, currentSeasonNum, isLoaded]);

  // Contador de goles totales (Solo temporada actual)
  const totalGoals = useMemo(() => {
    if (!isLoaded) return 0;
    return safeMatches
      .filter((m) => m.played && Number(m.season_id || m.season) === currentSeasonNum)
      .reduce((sum, m) => sum + (Number(m.home_goals) || 0) + (Number(m.away_goals) || 0), 0);
  }, [safeMatches, currentSeasonNum, isLoaded]);

  /* =======================
      GUARDIA DE CARGA
     ======================= */
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

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      
      {/* BANNER DE CLAUSURA: Solo si TODAS las divisiones han terminado */}
      {isGlobalSeasonFinished && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 p-6 rounded-xl shadow-2xl mb-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-emerald-400 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
              <ShieldCheck className="w-10 h-10 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Temporada {currentSeasonNum} Completada</h2>
              <p className="text-emerald-100 text-sm font-medium">Todas las divisiones han finalizado sus calendarios. Listo para procesar ascensos y descensos.</p>
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
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-black uppercase px-10 py-6 rounded-lg shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Cerrar Temporada {currentSeasonNum} e Ir a T{currentSeasonNum + 1}
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={`Panel de Control - T${currentSeasonNum}`}
          description="Resumen en tiempo real de la Liga Titán."
        />
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Componente principal del Dashboard (Tablas y Partidos) */}
      <DashboardClient onMatchClick={setSelectedMatch} />

      {/* Modal de Detalles del Partido */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all">
          <Card className="max-w-lg w-full relative shadow-2xl border-2 border-slate-800 animate-in zoom-in-95 duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-slate-100 rounded-full"
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center border-b bg-slate-50/50 pb-4">
              <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">
                Resumen del Encuentro
              </div>
              <CardTitle className="text-xl font-black italic">
                {getTeamById(selectedMatch.home_team)?.name} 
                <span className="mx-2 text-slate-300 font-normal">vs</span>
                {getTeamById(selectedMatch.away_team)?.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="py-6 max-h-[450px] overflow-y-auto">
              <div className="space-y-4">
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  getMatchEvents(selectedMatch.id).map((event) => {
                    const isHome = String(event.team_id) === String(selectedMatch.home_team);

                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-4 ${isHome ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <div className="flex flex-col items-center">
                           <span className="font-black text-blue-600 text-xs">{event.minute}'</span>
                           <div className={`w-1 h-8 ${isHome ? "bg-blue-100" : "bg-slate-100"} rounded-full`} />
                        </div>
                        
                        <div className={`flex flex-col ${isHome ? "items-start" : "items-end"} flex-1`}>
                          <div className="flex items-center gap-2">
                             {event.type === 'GOAL' && <Goal className="w-3 h-3 text-green-600" />}
                             <span className="text-sm font-black italic uppercase tracking-tight">
                               {event.playerName}
                             </span>
                          </div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1">
                            {event.type.replace('_', ' ')}
                            {event.assistName && <span className="text-blue-500"> • ASIST: {event.assistName}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                    <AlertTriangle className="w-8 h-8 opacity-20" />
                    <p className="italic text-sm font-medium">No se registraron eventos en este partido.</p>
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