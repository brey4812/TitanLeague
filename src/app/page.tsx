"use client";

import { useContext, useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LeagueContext } from '@/context/league-context';
import { Trophy, Calendar, Goal, X, ArrowUpRight, ArrowDownLeft, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatchResult } from '@/lib/types';

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
    nextSeason
  } = useContext(LeagueContext);

  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  // 🔒 Protección total contra hidratación / datos incompletos
  if (
    !isLoaded ||
    !Array.isArray(teams) ||
    !Array.isArray(players) ||
    !Array.isArray(matches)
  ) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-black italic text-slate-400 animate-pulse uppercase">
        Cargando Panel de Control Titán...
      </div>
    );
  }

  // ✅ Temporada finalizada (normalizando a Number)
  const isSeasonFinished = useMemo(() => {
    const currentSeasonMatches = matches.filter(
      m => Number(m.season || 1) === Number(season || 1)
    );
    return (
      currentSeasonMatches.length > 0 &&
      currentSeasonMatches.every(m => m.played)
    );
  }, [matches, season]);

  const totalTeams = teams.length;
  const totalPlayers = players.length;

  // ✅ Goles totales (temporada actual)
  const totalGoals = useMemo(() => {
    return matches
      .filter(m => Number(m.season || 1) === Number(season || 1))
      .reduce(
        (sum, m) =>
          sum +
          (Number(m.home_goals) || 0) +
          (Number(m.away_goals) || 0),
        0
      );
  }, [matches, season]);

  const stats = [
    {
      title: "Temporada",
      value: Number(season || 1),
      icon: <FastForward className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Equipos",
      value: totalTeams,
      icon: <Trophy className="h-5 w-5 text-blue-600" />
    },
    {
      title: "Jornada Actual",
      value: Number(lastPlayedWeek || 1),
      icon: <Calendar className="h-5 w-5 text-purple-600" />
    },
    {
      title: "Goles (Temp)",
      value: totalGoals,
      icon: <Goal className="h-5 w-5 text-red-600" />
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={`Panel de Control - T${Number(season || 1)}`}
          description="Resumen en tiempo real de la Liga Titán."
        />

        {isSeasonFinished && (
          <Button
            onClick={() => {
              nextSeason();
              toast.info(`¡Bienvenidos a la Temporada ${Number(season || 1) + 1}!`);
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
        {stats.map(stat => (
          <Card key={stat.title} className="shadow-sm border-2 border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
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

      <DashboardClient onMatchClick={setSelectedMatch} />

      {/* Modal Partido */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <Card className="max-w-lg w-full shadow-2xl border-t-4 border-t-blue-600 relative bg-white">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedMatch(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-6 bg-slate-50 border-b">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 mb-4">
                Temporada {Number(selectedMatch.season || 1)} — Jornada {Number(selectedMatch.round)}
              </CardTitle>

              <div className="flex items-center justify-between px-4">
                {["home", "away"].map(side => {
                  const teamId =
                    side === "home"
                      ? selectedMatch.home_team
                      : selectedMatch.away_team;
                  const team = getTeamById(teamId);

                  return (
                    <div key={side} className="flex-1 flex flex-col items-center">
                      <img
                        src={team?.badge_url || ""}
                        className="h-14 w-14 object-contain"
                        alt=""
                      />
                      <p className="text-[10px] font-black uppercase mt-2 truncate">
                        {team?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="pt-6 pb-8 px-6 max-h-[400px] overflow-y-auto">
              {getMatchEvents(selectedMatch.id).length > 0 ? (
                getMatchEvents(selectedMatch.id).map(event => {
                  const isHome =
                    String(event.team_id) ===
                    String(selectedMatch.home_team);

                  return (
                    <div
                      key={event.id}
                      className={`flex ${isHome ? "justify-start" : "justify-end"}`}
                    >
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-400">{event.minute}'</span>
                        <span>{event.player_name || event.playerName}</span>
                        {event.type === "GOAL" && "⚽"}
                        {event.type === "YELLOW_CARD" && "🟨"}
                        {event.type === "RED_CARD" && "🟥"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-300 italic text-xs">
                  Sin eventos registrados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
