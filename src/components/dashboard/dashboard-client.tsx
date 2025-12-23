"use client";

import { useContext } from "react";
import { LeagueContext } from "@/context/league-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Download, Play } from "lucide-react";

export function DashboardClient() {
  const { matches, getTeamById, simulateMatchday, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">
          Resultados de Jornada
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] border-2">
            <Download className="mr-2 h-3.5 w-3.5" /> Descargar Resultados
          </Button>
          <Button 
            onClick={() => simulateMatchday()} 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
          >
            <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Simular Jornada
          </Button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <ScrollArea className="h-[500px]">
          {matches.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {matches.map((match: any) => {
                // CORRECCIÓN: Usamos 'home_team' y 'away_team' para que coincida con tu DB
                const home = getTeamById(match.home_team);
                const away = getTeamById(match.away_team);
                
                if (!home || !away) return null;

                return (
                  <div key={match.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center p-5 hover:bg-slate-50/50 transition-colors">
                    {/* LOCAL */}
                    <div className="flex items-center justify-end gap-4">
                      <span className="font-bold text-slate-700 text-sm">{home.name}</span>
                      <img src={home.badge_url} className="w-10 h-10 object-contain" alt="" />
                    </div>

                    {/* MARCADOR */}
                    <div className="flex items-center px-10">
                      <div className="bg-slate-900 text-white font-black text-xl px-6 py-1.5 rounded-xl min-w-[110px] text-center tracking-tighter shadow-lg">
                        {/* CORRECCIÓN: Usamos 'home_goals' y 'away_goals' */}
                        {match.played ? `${match.home_goals} - ${match.away_goals}` : "VS"}
                      </div>
                    </div>

                    {/* VISITANTE */}
                    <div className="flex items-center justify-start gap-4">
                      <img src={away.badge_url} className="w-10 h-10 object-contain" alt="" />
                      <span className="font-bold text-slate-700 text-sm">{away.name}</span>
                    </div>

                    {/* ACCIONES */}
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
              <p className="text-slate-400 font-bold italic">No hay partidos registrados.</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Añade equipos para que aparezcan sus duelos.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}