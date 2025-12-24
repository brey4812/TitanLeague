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
     HOOKS (SIEMPRE ARRIBA)
     ======================= */

  const safeTeams = Array.isArray(teams) ? teams : [];
  const safePlayers = Array.isArray(players) ? players : [];
  const safeMatches = Array.isArray(matches) ? matches : [];

  const currentSeason = Number(season || 1);

  const isSeasonFinished = useMemo(() => {
    if (!safeMatches.length) return false;

    const currentSeasonMatches = safeMatches.filter(
      (m) => Number(m.season || 1) === currentSeason
    );

    return (
      currentSeasonMatches.length > 0 &&
      currentSeasonMatches.every((m) => m.played)
    );
  }, [safeMatches, currentSeason]);

  const totalGoals = useMemo(() => {
    return safeMatches
      .filter((m) => Number(m.season || 1) === currentSeason)
      .reduce(
        (sum, m) =>
          sum +
          (Number(m.home_goals) || 0) +
          (Number(m.away_goals) || 0),
        0
      );
  }, [safeMatches, currentSeason]);

  /* =======================
     GUARDIA DE CARGA
     ======================= */

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Cargando Panel de Control Titán...
      </div>
    );
  }

  /* =======================
     DERIVADOS
     ======================= */

  const stats = [
    {
      title: "Temporada",
      value: currentSeason,
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

  /* =======================
     RENDER
     ======================= */

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={`Panel de Control - T${currentSeason}`}
          description="Resumen en tiempo real de la Liga Titán."
        />

        {isSeasonFinished && (
          <Button
            onClick={() => {
              nextSeason();
              toast.info(`¡Bienvenidos a la Temporada ${currentSeason + 1}!`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs animate-bounce"
          >
            <FastForward className="mr-2 h-4 w-4" />
            Iniciar Siguiente Temporada
          </Button>
        )}
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
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

      {/* Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedMatch(null)}
            >
              <X />
            </Button>

            <CardHeader className="text-center">
              <CardTitle>
                {getTeamById(selectedMatch.home_team)?.name} vs{" "}
                {getTeamById(selectedMatch.away_team)?.name}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {getMatchEvents(selectedMatch.id).map((event) => {
                const isHome =
                  String(event.team_id) ===
                  String(selectedMatch.home_team);

                return (
                  <div
                    key={event.id}
                    className={`flex ${
                      isHome ? "justify-start" : "justify-end"
                    }`}
                  >
                    <span className="text-xs">
                      {event.minute}' {event.player_name}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
