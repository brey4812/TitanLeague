"use client";

import { useState, useMemo, useContext, useTransition } from "react";
import { LeagueContext } from "@/context/league-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Play, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DashboardClient() {
  const { matches, divisions, getTeamById, isLoaded, refreshData } = useContext(LeagueContext);
  const [isPending, startTransition] = useTransition();
  
  // Estados para controlar el filtrado
  const [displayedDivision, setDisplayedDivision] = useState<string>("1");
  const [displayedWeek, setDisplayedWeek] = useState(1);

  // Filtrar partidos por división y jornada
  const filteredMatches = useMemo(() => {
    const divId = parseInt(displayedDivision);
    return matches.filter((m: any) => 
      Number(m.division_id) === divId && 
      Number(m.round) === displayedWeek
    );
  }, [matches, displayedDivision, displayedWeek]);

  // BLOQUEO: Verificar si todos los partidos de la jornada actual están jugados
  const isWeekFinished = useMemo(() => {
    if (filteredMatches.length === 0) return false;
    return filteredMatches.every((m: any) => m.played === true);
  }, [filteredMatches]);

  // Función para simular la jornada actual de la división seleccionada
  const handleSimulateMatchday = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/match/simulate-matchday', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            divisionId: displayedDivision, 
            week: displayedWeek 
          })
        });
        
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || "Error al simular");
        
        toast.success("Jornada simulada con éxito");
        await refreshData();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  // Función para el botón naranja: Simular todas las divisiones
  const handleSimulateAll = async () => {
    startTransition(async () => {
      try {
        for (const div of divisions) {
          const response = await fetch('/api/match/simulate-matchday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              divisionId: div.id, 
              week: displayedWeek 
            })
          });
          if (!response.ok) throw new Error(`Error en división ${div.id}`);
        }
        toast.success("Todas las divisiones simuladas");
        await refreshData();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      {/* Botón Superior Naranja */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSimulateAll}
          disabled={isPending}
          variant="outline" 
          className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold uppercase text-[10px]"
        >
          <Zap className="mr-2 h-3.5 w-3.5 fill-amber-500" />
          Simular todas las divisiones
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
            <SelectTrigger className="w-[180px] border-2 font-bold text-slate-700">
              <SelectValue placeholder="División" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((div) => (
                <SelectItem key={div.id} value={String(div.id)}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setDisplayedWeek(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1 font-black uppercase text-[10px]">
              Jornada {displayedWeek}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setDisplayedWeek(prev => prev + 1)}
              disabled={!isWeekFinished} // BLOQUEO: No avanza si no se ha simulado
            >
              <ChevronRight className={`h-4 w-4 ${!isWeekFinished ? 'opacity-20' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] border-2">
            <Download className="mr-2 h-3.5 w-3.5" /> Descargar Resultados
          </Button>
          <Button 
            onClick={handleSimulateMatchday}
            disabled={isPending || isWeekFinished}
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
          >
            <Play className="mr-2 h-3.5 w-3.5 fill-current" /> 
            {isWeekFinished ? "Jornada Finalizada" : "Simular Jornada"}
          </Button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <ScrollArea className="h-[500px]">
          {filteredMatches.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredMatches.map((match: any) => {
                const home = getTeamById(match.home_team);
                const away = getTeamById(match.away_team);
                
                if (!home || !away) return null;

                return (
                  <div key={match.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-end gap-4">
                      <span className="font-bold text-slate-700 text-sm">{home.name}</span>
                      <img src={home.badge_url} className="w-10 h-10 object-contain" alt="" />
                    </div>

                    <div className="flex items-center px-10">
                      <div className="bg-slate-900 text-white font-black text-xl px-6 py-1.5 rounded-xl min-w-[110px] text-center tracking-tighter shadow-lg">
                        {match.played ? `${match.home_goals} - ${match.away_goals}` : "VS"}
                      </div>
                    </div>

                    <div className="flex items-center justify-start gap-4">
                      <img src={away.badge_url} className="w-10 h-10 object-contain" alt="" />
                      <span className="font-bold text-slate-700 text-sm">{away.name}</span>
                    </div>

                    <div className="pl-4">
                      <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-600">
                        <FileText className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-slate-400 font-bold italic">No hay partidos para esta selección.</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Jornada {displayedWeek} - {divisions.find(d => String(d.id) === displayedDivision)?.name}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}