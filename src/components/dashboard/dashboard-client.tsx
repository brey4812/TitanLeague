"use client";

import { useState, useMemo, useContext } from "react";
import { LeagueContext } from "@/context/league-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// COMPONENTE PARA CADA FILA DE PARTIDO
const MatchCard = ({ match, getTeamById }: any) => {
    // Intentamos obtener el ID del equipo local y visitante de cualquier columna posible
    const hId = match.home_team_id || match.home_id || match.homeTeamId;
    const aId = match.away_team_id || match.away_id || match.awayTeamId;
    
    const homeTeam = getTeamById(hId);
    const awayTeam = getTeamById(aId);

    // Si no encuentra el equipo, mostramos un mensaje de depuración en consola
    if (!homeTeam || !awayTeam) {
        console.warn("No se pudo cargar el equipo para el partido:", match.id);
        return null;
    }

    return (
      <div className="border-b last:border-0 p-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="font-bold text-sm text-right">{homeTeam.name}</span>
            <img 
                src={homeTeam.badge_url || homeTeam.logo || "/placeholder-team.png"} 
                className="h-10 w-10 object-contain" 
                alt="logo" 
            />
          </div>
          <div className="flex flex-col items-center px-6">
            <div className="font-black text-xl bg-slate-900 text-white px-4 py-1 rounded-lg min-w-[80px] text-center">
              {match.played 
                ? `${match.home_goals || 0} - ${match.away_goals || 0}` 
                : "VS"}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-start">
            <img 
                src={awayTeam.badge_url || awayTeam.logo || "/placeholder-team.png"} 
                className="h-10 w-10 object-contain" 
                alt="logo" 
            />
            <span className="font-bold text-sm text-left">{awayTeam.name}</span>
          </div>
        </div>
      </div>
    );
};

// COMPONENTE PRINCIPAL DEL PANEL
export function DashboardClient() {
  const { matches, divisions, getTeamById, isLoaded } = useContext(LeagueContext);
  const [displayedDivision, setDisplayedDivision] = useState<string>('1');

  // 1. Calculamos la jornada actual buscando en 'round', 'week' o 'matchday'
  const currentRound = useMemo(() => {
    if (!matches || matches.length === 0) return 1;
    const rounds = matches.map((m: any) => (m.round || m.week || m.matchday || 0));
    const max = Math.max(...rounds);
    return max <= 0 ? 1 : max;
  }, [matches]);

  // 2. Filtramos los partidos para que coincidan con la división y la jornada
  const matchesForDisplayedRound = useMemo(() => {
    const divId = parseInt(displayedDivision);
    return matches.filter((m: any) => {
      const mRound = m.round || m.week || m.matchday || 0;
      const mDiv = m.division_id || m.divisionId;
      return Number(mRound) === currentRound && Number(mDiv) === divId;
    });
  }, [matches, currentRound, displayedDivision]);

  if (!isLoaded) return <div className="p-10 text-center italic">Cargando base de datos...</div>;

  return (
    <Card className="border-2 border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 border-b bg-slate-50/50">
        <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
            Resultados de Jornada
        </CardTitle>
        <div className="flex items-center gap-3">
          <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
            <SelectTrigger className="w-[180px] font-bold border-2">
                <SelectValue placeholder="División" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((div: any) => (
                <SelectItem key={div.id} value={String(div.id)} className="font-bold">
                    {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className="h-10 px-4 bg-blue-600 text-white border-none font-black text-sm">
            JORNADA {currentRound}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {matchesForDisplayedRound.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {matchesForDisplayedRound.map((match: any) => (
                <MatchCard key={match.id} match={match} getTeamById={getTeamById} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-slate-50/30">
              <p className="text-slate-400 font-medium italic">No hay partidos en la base de datos.</p>
              <p className="text-xs text-blue-500 mt-2 font-bold uppercase">
                Ve a "Configuración" y genera el calendario para la División {displayedDivision}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}