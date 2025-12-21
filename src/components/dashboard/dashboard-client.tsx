"use client";

import { useState, useRef, useTransition, useMemo, useEffect, useContext } from "react";
import Image from "next/image";
import type { MatchResult, Team, Player } from "@/lib/types";
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

const MatchCard = ({ match, getTeamById, getPlayerById }: { match: MatchResult, getTeamById: (id: number) => Team | undefined, getPlayerById: (id: number) => Player | undefined }) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    const mvp = match.mvpId ? getPlayerById(match.mvpId) : null;

    if (!homeTeam || !awayTeam) return null;

    return (
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={32} height={32} className="rounded-full" data-ai-hint={homeTeam.dataAiHint} />
          <span className="font-medium text-right truncate text-sm sm:text-base flex-1">{homeTeam.name}</span>
        </div>
        <div className="text-center font-bold text-base sm:text-lg mx-2 sm:mx-4">
          <span>{match.homeScore} - {match.awayScore}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <span className="font-medium text-left truncate text-sm sm:text-base flex-1">{awayTeam.name}</span>
          <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={32} height={32} className="rounded-full" data-ai-hint={awayTeam.dataAiHint} />
        </div>
        <div className="flex flex-col items-center ml-2 sm:ml-4 w-20 sm:w-28 text-center">
            {mvp ? (
                <Badge variant="outline" className="flex items-center gap-1.5 py-0.5 px-1.5 sm:px-2">
                    <Icons.Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold truncate text-xs">{mvp.name}</span>
                </Badge>
            ) : <div className="h-5 sm:h-6"/>}
            {mvp && <span className="text-xs text-muted-foreground mt-0.5 sm:mt-1">MVP</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => (document.dispatchEvent(new CustomEvent('showPressNotes', { detail: match })))}>
            <Icons.Press className="h-4 w-4" />
        </Button>
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
  const resultsExportRef = useRef<HTMLDivElement>(null);

  const maxWeek = useMemo(() => matches.reduce((max, m) => Math.max(max, m.week), 0), [matches]);
  const [displayedWeek, setDisplayedWeek] = useState(maxWeek);
  const [displayedDivision, setDisplayedDivision] = useState<string>('1');
  
  useEffect(() => {
    if (isLoaded) {
      const maxW = matches.reduce((max, m) => Math.max(max, m.week), 0)
      setDisplayedWeek(maxW);
      if (divisions.length > 0) {
        setDisplayedDivision(String(divisions[0].id))
      }
    }
  }, [isLoaded, divisions, matches]);


  const matchesForDisplayedWeek = useMemo(() => {
    const divisionId = parseInt(displayedDivision);
    if (isNaN(divisionId) || !isLoaded) return [];
    
    return matches
      .filter(m => {
        const homeTeam = getTeamById(m.homeTeamId);
        return m.week === displayedWeek && homeTeam?.division === divisionId;
      })
      .sort((a,b) => b.id - a.id);
  }, [matches, displayedWeek, displayedDivision, getTeamById, isLoaded]);


  const handleDownloadPressNotes = async () => {
    if (!pressNoteRef.current) return;
    
    const canvas = await html2canvas(pressNoteRef.current, { useCORS: true });
    const link = document.createElement('a');
    link.download = `press-notes-${selectedMatch?.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const handleDownloadResults = async () => {
    if (!resultsExportRef.current) return;
    
    toast({
        title: 'Generando Imagen...',
        description: 'Por favor espera mientras creamos la imagen.'
    });

    try {
        const canvas = await html2canvas(resultsExportRef.current, {
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
  
    // Effect to listen for custom event
    useEffect(() => {
        const listener = (event: Event) => {
            if (typeof document === 'undefined') return;
            const match = (event as CustomEvent).detail;
            handleShowPressNotes(match);
        };
        document.addEventListener('showPressNotes', listener);
        return () => {
            document.removeEventListener('showPressNotes', listener);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const handleSimulateMatchday = () => {
    startTransition(() => {
        const newWeek = maxWeek + 1;
        simulateMatchday();
        setDisplayedWeek(newWeek);
        toast({
            title: `Jornada ${newWeek} Simulada`,
            description: "Se han generado nuevos resultados de partidos para todas las divisiones."
        })
    });
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

  if (!isLoaded) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
       <Card>
        <CardHeader className="flex-col items-start gap-4">
          <CardTitle>Resultados</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
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
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDisplayedWeek(w => Math.max(1, w - 1))}>
                        <Icons.ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5 h-9">Jornada {displayedWeek}</Badge>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDisplayedWeek(w => w + 1)} disabled={isPending || displayedWeek >= maxWeek}>
                        <Icons.ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadResults} variant="outline" className="h-9 w-full sm:w-auto">
                    <Icons.Download className="mr-2 h-4 w-4"/>
                    <span className="sm:hidden">Descargar</span>
                    <span className="hidden sm:inline">Descargar Resultados</span>
                </Button>
                <Button onClick={handleSimulateMatchday} disabled={isPending} className="h-9 w-full sm:w-auto">
                  {isPending ? 'Simulando...' : <><Icons.Play className="mr-2 h-4 w-4"/> <span className="sm:hidden">Simular</span> <span className="hidden sm:inline">Simular Jornada</span></>}
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div id="results-list">
                {matchesForDisplayedWeek.length > 0 ? matchesForDisplayedWeek.map((match) => (
                    <MatchCard key={match.id} match={match} getTeamById={getTeamById} getPlayerById={getPlayerById} />
                )) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground p-4 text-center">
                    No hay partidos para esta jornada y división.
                  </div>
                )}
              </div>
            </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Hidden container for export */}
      <div className="absolute -z-10 -left-[9999px] top-0">
        <div ref={resultsExportRef} className="bg-card p-4 min-w-[600px]">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-center mb-4 font-headline">Resultados - Jornada {displayedWeek}</h2>
              {matchesForDisplayedWeek.length > 0 ? matchesForDisplayedWeek.map((match) => (
                  <MatchCard key={`export-${match.id}`} match={match} getTeamById={getTeamById} getPlayerById={getPlayerById} />
              )) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground p-8">
                  No hay partidos para esta jornada y división.
                </div>
              )}
            </div>
        </div>
      </div>


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
    </>
  );
}
