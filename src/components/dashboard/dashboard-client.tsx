"use client";

import { useState, useRef, useTransition, useMemo, useEffect, useContext } from "react";
import Image from "next/image";
import type { MatchResult, Team, Player, MatchEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { generatePressNotes } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import html2canvas from 'html2canvas';
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeagueContext } from "@/context/league-context";
import { ChevronDown, ChevronUp, Goal } from "lucide-react";

const MatchCard = ({ match, getTeamById, getPlayerById }: any) => {
    const [showEvents, setShowEvents] = useState(false);
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    if (!homeTeam || !awayTeam) return null;

    return (
      <div className="border-b last:border-0">
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative h-8 w-8 shrink-0">
                <Image src={homeTeam.badge_url || "/placeholder-team.png"} alt="" fill className="object-contain" unoptimized />
            </div>
            <span className="font-bold truncate text-sm flex-1 text-right">{homeTeam.name}</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer px-4" onClick={() => setShowEvents(!showEvents)}>
            <div className="text-center font-black text-lg bg-slate-900 text-white px-3 py-0.5 rounded-md">
              {match.homeScore} - {match.awayScore}
            </div>
            {showEvents ? <ChevronUp className="h-3 w-3 mt-1" /> : <ChevronDown className="h-3 w-3 mt-1" />}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-bold truncate text-sm flex-1 text-left">{awayTeam.name}</span>
            <div className="relative h-8 w-8 shrink-0">
                <Image src={awayTeam.badge_url || "/placeholder-team.png"} alt="" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      </div>
    );
};

export function DashboardClient() {
  const { matches, divisions, getTeamById, getPlayerById, simulateMatchday, isLoaded } = useContext(LeagueContext);
  const [isPending, startTransition] = useTransition();
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [pressNotes, setPressNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const pressNoteRef = useRef<HTMLDivElement>(null);

  const maxWeek = useMemo(() => matches.length > 0 ? Math.max(...matches.map(m => m.week)) : 0, [matches]);
  const [displayedWeek, setDisplayedWeek] = useState(1);
  const [displayedDivision, setDisplayedDivision] = useState<string>('1');

  useEffect(() => {
    if (isLoaded) {
      if (maxWeek > 0) setDisplayedWeek(maxWeek);
      if (divisions.length > 0) setDisplayedDivision(String(divisions[0].id));
    }
  }, [isLoaded, divisions, maxWeek]);

  const matchesForDisplayedWeek = useMemo(() => {
    const divId = parseInt(displayedDivision);
    return matches.filter(m => {
      const hTeam = getTeamById(m.homeTeamId as any);
      return m.week === displayedWeek && hTeam?.division_id === divId;
    });
  }, [matches, displayedWeek, displayedDivision, getTeamById]);

  const handleDownloadPressNotes = async () => {
    if (!pressNoteRef.current) return;
    const canvas = await html2canvas(pressNoteRef.current, { useCORS: true });
    const link = document.createElement('a');
    link.download = `nota-prensa-${selectedMatch?.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShowPressNotes = async (match: MatchResult) => {
    setSelectedMatch(match);
    setIsLoading(true);
    setPressNotes(null);
    const home = getTeamById(match.homeTeamId as any);
    const away = getTeamById(match.awayTeamId as any);
    if (!home || !away) return;
    
    // El input debe cumplir con la interfaz GeneratePressNotesInput
    const result = await generatePressNotes({
      team1Name: home.name,
      team1Logo: home.badge_url,
      team1Wins: home.stats.wins,
      team1Draws: home.stats.draws,
      team1Losses: home.stats.losses,
      team1GoalsFor: home.stats.goalsFor,
      team1GoalsAgainst: home.stats.goalsAgainst,
      team2Name: away.name,
      team2Logo: away.badge_url,
      team2Wins: away.stats.wins,
      team2Draws: away.stats.draws,
      team2Losses: away.stats.losses,
      team2GoalsFor: away.stats.goalsFor,
      team2GoalsAgainst: away.stats.goalsAgainst,
      matchType: "Derby" // Usamos "Derby" que suele ser un valor aceptado por defecto
    });

    if (result.success && result.data) {
        setPressNotes(result.data.pressNotes);
    } else {
        toast({ title: "Error", description: "No se pudo generar la nota de prensa.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const listener = (event: Event) => handleShowPressNotes((event as CustomEvent).detail);
    document.addEventListener('showPressNotes', listener);
    return () => document.removeEventListener('showPressNotes', listener);
  }, [getTeamById]);

  if (!isLoaded) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-sm">
        <CardHeader className="flex-col items-start gap-4 pb-4 border-b">
          <CardTitle className="text-xl font-black uppercase tracking-tighter">Resultados de Jornada</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10 font-bold uppercase text-xs">
                    <SelectValue placeholder="División" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(div => <SelectItem key={div.id} value={String(div.id)} className="font-bold">{div.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Badge variant="outline" className="text-xs font-black px-4 bg-background">JORNADA {displayedWeek}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => startTransition(() => simulateMatchday())} disabled={isPending} size="sm" className="h-10 font-black uppercase text-[10px] bg-blue-600 hover:bg-blue-700">
                  {isPending ? 'Simulando...' : <><Icons.Play className="mr-2 h-3 w-3"/> Simular Jornada</>}
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="divide-y">
                {matchesForDisplayedWeek.map((match) => (
                    <MatchCard key={match.id} match={match} getTeamById={getTeamById} getPlayerById={getPlayerById} />
                ))}
              </div>
            </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div ref={pressNoteRef} className="p-8 bg-white text-slate-900">
              <div className="border-b-4 border-blue-600 pb-6 mb-6 text-center text-4xl font-black">
                {selectedMatch?.homeScore} - {selectedMatch?.awayScore}
              </div>
              <div dangerouslySetInnerHTML={{ __html: pressNotes?.replace(/\n/g, '<br />') || "" }} className="text-sm leading-relaxed" />
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 bg-slate-50 border-t">
            <Button onClick={handleDownloadPressNotes} className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs w-full sm:w-auto">
              <Icons.Download className="mr-2 h-4 w-4" /> Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}