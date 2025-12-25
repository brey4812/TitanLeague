"use client";

import { useContext, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy, Calendar, Goal, X, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatchResult } from "@/lib/types";

export default function DashboardPage() {
  const {
    teams,
    players,
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
      SANEAMIENTO DE DATOS (Anti-Error #310)
     ======================= */
  const safeTeams = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);
  const safeMatches = useMemo(() => (Array.isArray(matches) ? matches : []), [matches]);
  
  // Sincronización con season_number de la DB
  const currentSeasonNum = Number(season || 1);

  const isSeasonFinished = useMemo(() => {
    if (!isLoaded || !safeMatches.length) return false;

    // Filtramos partidos usando la propiedad season vinculada a la DB
    const currentSeasonMatches = safeMatches.filter(
      (m) => Number(m.season || 1) === currentSeasonNum
    );

    return (
      currentSeasonMatches.length > 0 &&
      currentSeasonMatches.every((m) => m.played)
    );
  }, [safeMatches, currentSeasonNum, isLoaded]);

  const totalGoals = useMemo(() => {
    if (!isLoaded) return 0;
    return safeMatches
      .filter((m) => Number(m.season || 1) === currentSeasonNum)
      .reduce(
        (sum, m) =>
          sum +
          (Number(m.home_goals) || 0) +
          (Number(m.away_goals) || 0),
        0
      );
  }, [safeMatches, currentSeasonNum, isLoaded]);

  /* =======================
      GUARDIA DE CARGA
     ======================= */
  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Sincronizando con Liga Titán...
      </div>
    );
  }

  const stats = [
    {
      title: "Temporada",
      value: currentSeasonNum,
      icon: <FastForward className="h-5 w-5 text-orange-600" />,
    },
    {
      title: "Equipos",
      value: safeTeams.length,
      icon: <Trophy className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Jornada Actual",
      value: Number(lastPlayedWeek || 1),
      icon: <Calendar className="h-5 w-5 text-purple-600" />,
    },
    {
      title: "Goles (Temp)",
      value: totalGoals,
      icon: <Goal className="h-5 w-5 text-red-600" />,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={`Panel de Control - T${currentSeasonNum}`}
          description="Resumen en tiempo real de la Liga Titán."
        />

        {isSeasonFinished && (
          <Button
            onClick={() => {
              nextSeason();
              toast.success(`¡Iniciando los preparativos de la Temporada ${currentSeasonNum + 1}!`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs animate-bounce"
          >
            <FastForward className="mr-2 h-4 w-4" />
            Cerrar Temporada e Ir a T{currentSeasonNum + 1}
          </Button>
        )}
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">
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

      <DashboardClient onMatchClick={setSelectedMatch} />

      {/* Modal de Detalles del Partido */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-lg w-full relative shadow-2xl border-2 border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center border-b pb-4">
              <div className="text-xs font-black uppercase text-slate-400 mb-1">
                Detalles del Encuentro
              </div>
              <CardTitle className="text-xl">
                {getTeamById(selectedMatch.home_team)?.name} vs{" "}
                {getTeamById(selectedMatch.away_team)?.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="py-6 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {getMatchEvents(selectedMatch.id).length > 0 ? (
                  getMatchEvents(selectedMatch.id).map((event) => {
                    const isHome = String(event.team_id) === String(selectedMatch.home_team);

                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 ${isHome ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <span className="font-bold text-orange-500 text-sm">{event.minute}'</span>
                        <div className={`flex flex-col ${isHome ? "items-start" : "items-end"}`}>
                          {/* CORRECCIÓN: Usar playerName y assistName según types.ts */}
                          <span className="text-sm font-black">{event.playerName}</span>
                          <span className="text-[10px] uppercase text-slate-400">
                            {event.type.replace('_', ' ')}
                            {event.assistName && ` (Asist: ${event.assistName})`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-400 italic text-sm py-4">
                    No se registraron eventos destacados en este partido.
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