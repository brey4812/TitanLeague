"use client";

import { useState, useMemo, useContext, useTransition } from "react";
import Image from "next/image";
import { LeagueContext } from "@/context/league-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Trophy, FileText, Download, Play } from "lucide-react";

export function DashboardClient() {
  const { matches, divisions, getTeamById, simulateMatchday, isLoaded } = useContext(LeagueContext);
  const [isPending, startTransition] = useTransition();
  const [displayedDivision, setDisplayedDivision] = useState<string>("1");
  const [displayedWeek, setDisplayedWeek] = useState(1);

  // Filtrado de partidos por división y semana
  const filteredMatches = useMemo(() => {
    const divId = parseInt(displayedDivision);
    return matches.filter((m) => {
      // Usamos home_team y division_id de la base de datos
      return Number(m.division_id) === divId && m.week === displayedWeek;
    });
  }, [matches, displayedDivision, displayedWeek]);

  if (!isLoaded) return <Skeleton className="h-[500px] w-full" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 bg-[#12141c] min-h-screen text-white">
      
      {/* SECCIÓN IZQUIERDA: PRÓXIMOS PARTIDOS (played: false) */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Próximos Partidos</h2>
          <div className="flex items-center gap-3">
            <Select value={displayedDivision} onValueChange={setDisplayedDivision}>
              <SelectTrigger className="w-[200px] bg-[#1e2230] border-none font-bold text-white">
                <SelectValue placeholder="División" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="bg-[#1e2230] border-none text-xs font-bold uppercase text-white hover:bg-slate-700">
              <Download className="mr-2 h-3.5 w-3.5" /> Descargar Partidos
            </Button>
          </div>
          <div className="flex items-center gap-2">
             <span className="font-bold uppercase text-sm text-slate-400">Jornada {displayedWeek}</span>
             <Button variant="ghost" size="icon" className="h-6 w-6 bg-[#1e2230] text-white" onClick={() => setDisplayedWeek(w => w + 1)}>
                <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {filteredMatches.filter(m => !m.played).map((match) => {
              const home = getTeamById(match.home_team as any);
              const away = getTeamById(match.away_team as any);
              if (!home || !away) return null;

              return (
                <div key={match.id} className="bg-[#e9ecef] rounded-xl p-6 flex items-center justify-between text-slate-900 shadow-lg border-b-4 border-slate-300">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={home.badge_url} className="w-12 h-12 object-contain" alt="" />
                    <span className="font-black text-lg uppercase truncate">{home.name}</span>
                  </div>
                  
                  <div className="px-8 font-black text-xl text-slate-400 italic">VS</div>

                  <div className="flex items-center gap-4 flex-1 justify-end text-right">
                    <span className="font-black text-lg uppercase truncate">{away.name}</span>
                    <img src={away.badge_url} className="w-12 h-12 object-contain" alt="" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </section>

      {/* SECCIÓN DERECHA: RESULTADOS (played: true) */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Resultados Jornada {displayedWeek}</h2>
            <div className="flex flex-col gap-2">
                <Button className="bg-[#007bff] hover:bg-[#0056b3] font-bold text-[10px] uppercase h-10 text-white">
                    <Download className="mr-2 h-4 w-4" /> Descargar Resultados
                </Button>
                <Button 
                    onClick={() => startTransition(() => simulateMatchday())} 
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase h-10 text-white"
                >
                    {isPending ? "Simulando..." : <><Play className="mr-2 h-3.5 w-3.5 fill-current" /> Simular Jornada</>}
                </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {filteredMatches.filter(m => m.played).map((match) => {
              const home = getTeamById(match.home_team as any);
              const away = getTeamById(match.away_team as any);
              if (!home || !away) return null;

              return (
                <div key={match.id} className="bg-white rounded-xl p-6 flex items-center justify-between text-slate-900 border-l-8 border-[#007bff] shadow-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={home.badge_url} className="w-12 h-12 object-contain" alt="" />
                    <span className="font-black text-lg uppercase truncate">{home.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center px-6">
                      <div className="font-black text-4xl italic tracking-tighter">
                          {match.home_goals} - {match.away_goals}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Final</span>
                  </div>

                  <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="flex items-center gap-2 mr-4">
                          <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-slate-500 italic">MVP</span>
                      </div>
                      <img src={away.badge_url} className="w-12 h-12 object-contain" alt="" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}