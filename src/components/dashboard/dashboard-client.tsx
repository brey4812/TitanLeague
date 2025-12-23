"use client";

import { useState, useMemo, useContext } from "react";
import { LeagueContext } from "@/context/league-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const MatchCard = ({ match, getTeamById }: any) => {
    const homeTeam = getTeamById(match.home_team_id || match.homeTeamId);
    const awayTeam = getTeamById(match.away_team_id || match.awayTeamId);

    if (!homeTeam || !awayTeam) return null;

    return (
      <div className="border-b last:border-0 p-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="font-bold text-sm text-right">{homeTeam.name}</span>
            <img src={homeTeam.badge_url} className="h-10 w-10 object-contain" alt="" />
          </div>
          <div className="flex flex-col items-center px-6">
            <div className="font-black text-xl bg-slate-900 text-white px-4 py-1 rounded-lg">
              {match.played ? `${match.home_goals} - ${match.away_goals}` : "VS"}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-start">
            <img src={awayTeam.badge_url} className="h-10 w-10 object-contain" alt="" />
            <span className="font-bold text-sm text-left">{awayTeam.name}</span>
          </div>
        </div>
      </div>
    );
};

export function DashboardClient() {
  const { matches, divisions, getTeamById, isLoaded, simulateMatchday } = useContext(LeagueContext);
  const [displayedDivision, setDisplayedDivision] = useState<string>('1');

  const maxWeek = useMemo(() => {
    const weeks = matches.map((m: any) => (m.week || m.matchday || 0));
    return weeks.length > 0 ? Math.max(...weeks) : 1;
  }, [matches]);

  const matchesForDisplayedWeek = useMemo(() => {
    const divId = parseInt(displayedDivision);
    return matches.filter((m: any) => {
      const hId = m.home_team_id || m.homeTeamId;
      const hTeam = getTeamById(hId);
      const matchWeek = m.week || m.matchday || 0;
      const targetWeek = maxWeek === 0 ? 1 : maxWeek;
      return matchWeek === targetWeek && hTeam?.division_id === divId;
    });
  }, [matches, maxWeek, displayedDivision, getTeamById]);

  if (!isLoaded) return <div className="p-10 text-center italic">Cargando partidos...</div>;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 border-b">
        <CardTitle className="text-xl font-black uppercase italic">Resultados de Jornada</CardTitle>
        <div className="flex items-center gap-3">
          <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
            <SelectTrigger className="w-[180px] font-bold"><SelectValue placeholder="División" /></SelectTrigger>
            <SelectContent>
              {divisions.map((div: any) => <SelectItem key={div.id} value={String(div.id)} className="font-bold">{div.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge className="h-10 px-4 bg-slate-100 text-slate-900 border-2 font-black">JORNADA {maxWeek || 1}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {matchesForDisplayedWeek.length > 0 ? (
            <div className="divide-y">
              {matchesForDisplayedWeek.map((match: any) => (
                <MatchCard key={match.id} match={match} getTeamById={getTeamById} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground italic">No hay partidos generados.</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}