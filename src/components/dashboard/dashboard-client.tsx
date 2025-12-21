"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import Image from "next/image";
import type { MatchResult, Team, Player, Division } from "@/lib/types";
import { getTeamById, getAllTeams, getPlayerById, divisions } from "@/lib/data";
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

interface DashboardClientProps {
  recentMatches: MatchResult[];
}

const getRandomPlayer = (team: Team): Player | null => {
    if (!team || !team.roster || team.roster.length === 0) return null;
    const roster = team.roster;
    return roster[Math.floor(Math.random() * roster.length)];
}

export function DashboardClient({ recentMatches: initialMatches }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [allMatches, setAllMatches] = useState(initialMatches);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [pressNotes, setPressNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const pressNoteRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const maxWeek = useMemo(() => allMatches.reduce((max, m) => Math.max(max, m.week), 0), [allMatches]);
  const [displayedWeek, setDisplayedWeek] = useState(maxWeek);
  const [displayedDivision, setDisplayedDivision] = useState<string>(String(divisions[0].id));

  const matchesForDisplayedWeek = useMemo(() => {
    const divisionId = parseInt(displayedDivision);
    return allMatches
      .filter(m => {
        const homeTeam = getTeamById(m.homeTeamId);
        return m.week === displayedWeek && homeTeam?.division === divisionId;
      })
      .sort((a,b) => b.id - a.id);
  }, [allMatches, displayedWeek, displayedDivision]);


  const handleDownloadPressNotes = async () => {
    if (!pressNoteRef.current) return;
    
    const canvas = await html2canvas(pressNoteRef.current);
    const link = document.createElement('a');
    link.download = `press-notes-${selectedMatch?.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const handleDownloadResults = async () => {
    if (!resultsRef.current) return;
    
    toast({
        title: 'Generando Imagen...',
        description: 'Por favor espera mientras creamos la imagen.'
    });

    try {
        const canvas = await html2canvas(resultsRef.current, {
            useCORS: true,
            backgroundColor: null, 
        });
        const link = document.createElement('a');
        link.download = `jornada-${displayedWeek}-resultados.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error(error);
        toast({
            title: 'Descarga Fallida',
            description: 'Algo salió mal mientras se generaba la imagen.',
            variant: 'destructive'
        });
    }
  };

  const handleShowPressNotes = async (match: MatchResult) => {
    setSelectedMatch(match);
    setIsLoading(true);
    setPressNotes(null);

    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);

    if (!homeTeam || !awayTeam) {
        toast({ title: "Error", description: "Datos del equipo no encontrados.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const input = {
      team1Name: homeTeam.name,
      team1Logo: homeTeam.logoUrl,
      team1Wins: homeTeam.stats.wins,
      team1Draws: homeTeam.stats.draws,
      team1Losses: homeTeam.stats.losses,
      team1GoalsFor: homeTeam.stats.goalsFor,
      team1GoalsAgainst: homeTeam.stats.goalsAgainst,
      team2Name: awayTeam.name,
      team2Logo: awayTeam.logoUrl,
      team2Wins: awayTeam.stats.wins,
      team2Draws: awayTeam.stats.draws,
      team2Losses: awayTeam.stats.losses,
      team2GoalsFor: awayTeam.stats.goalsFor,
      team2GoalsAgainst: awayTeam.stats.goalsAgainst,
      matchType: "Derby" as const,
    };

    const result = await generatePressNotes(input);

    if (result.success && result.data) {
      setPressNotes(result.data.pressNotes);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSimulateMatchday = () => {
    startTransition(() => {
        const newMatches: MatchResult[] = [];
        const newWeek = maxWeek + 1;
        const latestId = allMatches.reduce((max, m) => Math.max(max, m.id), 0);
        let matchCounter = 0;

        divisions.forEach(division => {
            const teamsInDivision = [...division.teams];
            const pairedTeamIds = new Set<number>();

            while (teamsInDivision.length >= 2) {
                const team1Index = Math.floor(Math.random() * teamsInDivision.length);
                const team1 = teamsInDivision.splice(team1Index, 1)[0];
                
                const team2Index = Math.floor(Math.random() * teamsInDivision.length);
                const team2 = teamsInDivision.splice(team2Index, 1)[0];

                if (!team1 || !team2) continue;

                const homeTeam = Math.random() > 0.5 ? team1 : team2;
                const awayTeam = homeTeam.id === team1.id ? team2 : team1;

                const homeScore = Math.floor(Math.random() * 5);
                const awayScore = Math.floor(Math.random() * 5);
                
                let mvpPlayer: Player | null = null;
                if (homeScore > awayScore) {
                    mvpPlayer = getRandomPlayer(homeTeam);
                } else if (awayScore > homeScore) {
                    mvpPlayer = getRandomPlayer(awayTeam);
                } else {
                    mvpPlayer = getRandomPlayer(Math.random() > 0.5 ? homeTeam : awayTeam);
                }
                
                newMatches.push({
                    id: latestId + matchCounter + 1,
                    season: 1,
                    week: newWeek,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    homeScore: homeScore,
                    awayScore: awayScore,
                    isImportant: Math.random() > 0.7,
                    mvpId: mvpPlayer?.id,
                });
                matchCounter++;
            }
        });


        setAllMatches(prevMatches => [...prevMatches, ...newMatches]);
        setDisplayedWeek(newWeek);
        toast({
            title: `Jornada ${newWeek} Simulada`,
            description: "Se han generado nuevos resultados de partidos para todas las divisiones."
        })
    });
};

  const MatchCard = ({ match }: { match: MatchResult }) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    const mvp = match.mvpId ? getPlayerById(match.mvpId) : null;


    if (!homeTeam || !awayTeam) return null;

    return (
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={40} height={40} className="rounded-full" data-ai-hint={homeTeam.dataAiHint} />
          <span className="font-medium text-right w-20 sm:w-32 truncate">{homeTeam.name}</span>
        </div>
        <div className="text-center font-bold text-lg mx-2 sm:mx-4">
          <span>{match.homeScore} - {match.awayScore}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <span className="font-medium text-left w-20 sm:w-32 truncate">{awayTeam.name}</span>
          <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={40} height={40} className="rounded-full" data-ai-hint={awayTeam.dataAiHint} />
        </div>
        <div className="flex flex-col items-center mx-4 w-28 text-center">
            {mvp ? (
                <Badge variant="outline" className="flex items-center gap-1.5">
                    <Icons.Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold truncate">{mvp.name}</span>
                </Badge>
            ) : <div className="h-6"/>}
            {mvp && <span className="text-xs text-muted-foreground mt-1">MVP</span>}
        </div>
        <div className="flex flex-col sm:flex-row gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShowPressNotes(match)}>
                <Icons.Press className="h-5 w-5" />
            </Button>
        </div>
      </div>
    );
  };
  
  const PressNoteContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 mt-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if(pressNotes) {
        return <div className="prose prose-sm dark:prose-invert mt-4" dangerouslySetInnerHTML={{ __html: pressNotes.replace(/\n/g, '<br />') }} />;
    }
    return null;
  }
  
  const homeTeam = selectedMatch ? getTeamById(selectedMatch.homeTeamId) : null;
  const awayTeam = selectedMatch ? getTeamById(selectedMatch.awayTeamId) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <Card className="lg:col-span-3" ref={resultsRef}>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Resultados</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleDownloadResults} variant="outline" className="h-10">
                <Icons.Download className="mr-2"/> Descargar Resultados
              </Button>
              <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Seleccionar División" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map(division => (
                    <SelectItem key={division.id} value={String(division.id)}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 justify-between">
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setDisplayedWeek(w => Math.max(1, w - 1))}>
                      <Icons.ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary" className="text-sm px-4 py-2 h-10">Jornada {displayedWeek}</Badge>
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setDisplayedWeek(w => w + 1)} disabled={isPending}>
                      <Icons.ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
              <Button onClick={handleSimulateMatchday} disabled={isPending} className="h-10">
                {isPending ? 'Simulando...' : <><Icons.Play className="mr-2"/> Simular Siguiente Jornada</>}
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
                {matchesForDisplayedWeek.length > 0 ? matchesForDisplayedWeek.map((match) => (
                    <MatchCard key={match.id} match={match} />
                )) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No hay partidos para esta jornada y división.
                  </div>
                )}
            </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMatch} onOpenChange={(isOpen) => !isOpen && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <ScrollArea className="max-h-[80vh] p-1">
            <div ref={pressNoteRef} className="p-6">
              <DialogHeader>
                  {homeTeam && awayTeam && (
                      <DialogTitle className="text-center text-2xl font-headline">
                          <div className="flex justify-around items-center">
                              <div className="flex flex-col items-center gap-2 text-center">
                                  <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={60} height={60} className="rounded-full" data-ai-hint={homeTeam.dataAiHint}/>
                                  <span className="text-base">{homeTeam.name}</span>
                              </div>
                              <span className="text-4xl font-black text-primary mx-2">VS</span>
                              <div className="flex flex-col items-center gap-2 text-center">
                                  <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={60} height={60} className="rounded-full" data-ai-hint={awayTeam.dataAiHint}/>
                                  <span className="text-base">{awayTeam.name}</span>
                              </div>
                          </div>
                      </DialogTitle>
                  )}
              </DialogHeader>
               {selectedMatch && (
                <div className="text-center font-bold text-3xl my-4">
                  <span>{selectedMatch.homeScore} - {selectedMatch.awayScore}</span>
                </div>
              )}
              <PressNoteContent />
            </div>
          </ScrollArea>
          {!isLoading && pressNotes && (
            <DialogFooter className="p-6 pt-0 border-t">
              <Button onClick={handleDownloadPressNotes}>
                <Icons.Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
