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

// Componente para la fila de cada partido
const MatchCard = ({ 
  match, 
  getTeamById, 
  getPlayerById 
}: { 
  match: MatchResult, 
  getTeamById: (id: number) => Team | undefined, 
  getPlayerById: (id: number) => Player | undefined 
}) => {
    const [showEvents, setShowEvents] = useState(false);
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    const mvp = match.mvpId ? getPlayerById(match.mvpId) : null;

    // Si no existen los equipos, no renderizamos para evitar errores de src en Image
    if (!homeTeam || !awayTeam) return null;

    // Definimos las URLs de los logos con un fallback seguro
    const homeLogo = homeTeam.badge_url || homeTeam.logo || "/placeholder-team.png";
    const awayLogo = awayTeam.badge_url || awayTeam.logo || "/placeholder-team.png";

    return (
      <div className="border-b last:border-0">
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
          {/* Local */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative h-8 w-8 shrink-0">
                <Image src={homeLogo} alt={homeTeam.name} fill className="object-contain" />
            </div>
            <span className="font-bold truncate text-sm sm:text-base flex-1 text-right">{homeTeam.name}</span>
          </div>
          
          {/* Marcador e Interacción */}
          <div 
            className="flex flex-col items-center cursor-pointer px-4 group"
            onClick={() => setShowEvents(!showEvents)}
          >
            <div className="text-center font-black text-lg sm:text-xl bg-slate-900 text-white px-3 py-0.5 rounded-md group-hover:bg-blue-600 transition-colors">
              {match.homeScore} - {match.awayScore}
            </div>
            {showEvents ? <ChevronUp className="h-3 w-3 mt-1 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 mt-1 text-muted-foreground" />}
          </div>

          {/* Visitante */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="font-bold truncate text-sm sm:text-base flex-1 text-left">{awayTeam.name}</span>
            <div className="relative h-8 w-8 shrink-0">
                <Image src={awayLogo} alt={awayTeam.name} fill className="object-contain" />
            </div>
          </div>

          {/* MVP y Acciones */}
          <div className="hidden sm:flex flex-col items-center ml-4 w-24 text-center">
              {mvp && (
                  <Badge variant="secondary" className="flex items-center gap-1 py-0.5">
                      <Icons.Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-bold truncate max-w-[60px]">{mvp.name}</span>
                  </Badge>
              )}
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => (document.dispatchEvent(new CustomEvent('showPressNotes', { detail: match })))}>
              <Icons.Press className="h-4 w-4" />
          </Button>
        </div>

        {/* Cronología de Eventos */}
        {showEvents && (
          <div className="bg-muted/30 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest mb-2 border-b pb-1">Cronología</p>
            {match.events && match.events.length > 0 ? (
              match.events.sort((a, b) => a.minute - b.minute).map((event: MatchEvent, idx: number) => (
                <div key={idx} className={`flex items-center gap-3 text-xs ${event.teamId === homeTeam.id ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="font-mono font-bold text-blue-600 bg-blue-100 px-1 rounded">{event.minute}'</span>
                  {event.type === 'goal' && <Goal className="h-3 w-3" />}
                  {event.type === 'yellow' && <div className="w-2 h-3 bg-yellow-400 border border-yellow-600 rounded-sm" />}
                  {event.type === 'red' && <div className="w-2 h-3 bg-red-600 border border-red-800 rounded-sm" />}
                  <span className="font-medium">{event.playerName}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-[10px] italic text-muted-foreground">Sin incidencias registradas</p>
            )}
          </div>
        )}
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
    return matches
      .filter(m => {
        const homeTeam = getTeamById(m.homeTeamId);
        return m.week === displayedWeek && homeTeam?.division_id === divId;
      })
      .sort((a, b) => b.id - a.id);
  }, [matches, displayedWeek, displayedDivision, getTeamById]);

  const handleDownloadPressNotes = async () => {
    if (!pressNoteRef.current) return;
    const canvas = await html2canvas(pressNoteRef.current, { useCORS: true });
    const link = document.createElement('a');
    link.download = `nota-prensa-${selectedMatch?.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const handleDownloadResults = async () => {
    if (!resultsExportRef.current) return;
    toast({ title: 'Generando Imagen...', description: 'Creando resumen de la jornada.' });
    try {
        const canvas = await html2canvas(resultsExportRef.current, { useCORS: true, backgroundColor: "#ffffff" });
        const link = document.createElement('a');
        link.download = `jornada-${displayedWeek}-resultados.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo generar la imagen.', variant: 'destructive' });
    }
  };

  const handleShowPressNotes = async (match: MatchResult) => {
    setSelectedMatch(match);
    setIsLoading(true);
    setPressNotes(null);
    const home = getTeamById(match.homeTeamId);
    const away = getTeamById(match.awayTeamId);
    if (!home || !away) { setIsLoading(false); return; }
    
    const result = await generatePressNotes({
      team1Name: home.name, team1Logo: home.badge_url || home.logo || "",
      team1Wins: home.stats.wins, team1Draws: home.stats.draws, team1Losses: home.stats.losses,
      team1GoalsFor: home.stats.goalsFor, team1GoalsAgainst: home.stats.goalsAgainst,
      team2Name: away.name, team2Logo: away.badge_url || away.logo || "",
      team2Wins: away.stats.wins, team2Draws: away.stats.draws, team2Losses: away.stats.losses,
      team2GoalsFor: away.stats.goalsFor, team2GoalsAgainst: away.stats.goalsAgainst,
      matchType: "Derby"
    });

    if (result.success && result.data) setPressNotes(result.data.pressNotes);
    setIsLoading(false);
  };

  useEffect(() => {
    const listener = (event: Event) => handleShowPressNotes((event as CustomEvent).detail);
    document.addEventListener('showPressNotes', listener);
    return () => document.removeEventListener('showPressNotes', listener);
  }, [getTeamById]);

  if (!isLoaded) return <Skeleton className="h-[400px] w-full" />;

  return (
    <>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDisplayedWeek(w => Math.max(1, w - 1))}>
                        <Icons.ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="text-xs font-black px-4 bg-background">JORNADA {displayedWeek}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDisplayedWeek(w => Math.min(maxWeek, w + 1))} disabled={displayedWeek >= maxWeek}>
                        <Icons.ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadResults} variant="outline" size="sm" className="h-10 font-bold uppercase text-[10px]">
                    <Icons.Download className="mr-2 h-3 w-3"/> Exportar
                </Button>
                <Button onClick={() => startTransition(() => simulateMatchday())} disabled={isPending} size="sm" className="h-10 font-black uppercase text-[10px] bg-blue-600 hover:bg-blue-700">
                  {isPending ? 'Simulando...' : <><Icons.Play className="mr-2 h-3 w-3"/> Simular Jornada</>}
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div id="results-list" className="divide-y">
                {matchesForDisplayedWeek.length > 0 ? matchesForDisplayedWeek.map((match) => (
                    <MatchCard key={match.id} match={match} getTeamById={getTeamById} getPlayerById={getPlayerById} />
                )) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
                    <Icons.Calendar className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin partidos para esta semana</p>
                  </div>
                )}
              </div>
            </ScrollArea>
        </CardContent>
      </Card>

      {/* Diálogo de Nota de Prensa */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div ref={pressNoteRef} className="p-8 bg-white text-slate-900">
              {/* Header del Diálogo */}
              <div className="border-b-4 border-blue-600 pb-6 mb-6">
                {selectedMatch && getTeamById(selectedMatch.homeTeamId) && getTeamById(selectedMatch.awayTeamId) ? (
                  <div className="flex justify-around items-center gap-4">
                    {/* Local */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="relative h-20 w-20 mb-2">
                        <Image 
                            src={getTeamById(selectedMatch.homeTeamId)?.badge_url || getTeamById(selectedMatch.homeTeamId)?.logo || "/placeholder-team.png"} 
                            alt="" 
                            fill 
                            className="object-contain" 
                        />
                      </div>
                      <span className="font-black text-sm uppercase text-center leading-none">{getTeamById(selectedMatch.homeTeamId)?.name}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-black text-blue-600 italic leading-none">
                        {selectedMatch.homeScore} - {selectedMatch.awayScore}
                      </span>
                      <Badge className="mt-2 bg-slate-900">FINALIZADO</Badge>
                    </div>

                    {/* Visitante */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="relative h-20 w-20 mb-2">
                        <Image 
                            src={getTeamById(selectedMatch.awayTeamId)?.badge_url || getTeamById(selectedMatch.awayTeamId)?.logo || "/placeholder-team.png"} 
                            alt="" 
                            fill 
                            className="object-contain" 
                        />
                      </div>
                      <span className="font-black text-sm uppercase text-center leading-none">{getTeamById(selectedMatch.awayTeamId)?.name}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              
              {isLoading ? (
                <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-full" /></div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: pressNotes?.replace(/\n/g, '<br />') || "" }} className="text-sm leading-relaxed" />
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 bg-slate-50 border-t">
            <Button onClick={handleDownloadPressNotes} className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs w-full sm:w-auto">
              <Icons.Download className="mr-2 h-4 w-4" /> Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contenedor oculto para exportación de imagen completa */}
      <div className="absolute -z-10 -left-[9999px] top-0">
        <div ref={resultsExportRef} className="bg-white p-8 min-w-[700px] border">
            <h2 className="text-3xl font-black text-center mb-8 uppercase tracking-tighter border-b-4 border-black pb-2">Jornada {displayedWeek}</h2>
            <div className="divide-y border">
              {matchesForDisplayedWeek.map((match) => (
                  <MatchCard key={`export-${match.id}`} match={match} getTeamById={getTeamById} getPlayerById={getPlayerById} />
              ))}
            </div>
        </div>
      </div>
    </>
  );
}