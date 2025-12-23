"use client";

import { useContext } from "react";
import { LeagueContext } from "@/context/league-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Play, FileText, ChevronRight } from "lucide-react";

export function DashboardClient() {
  const { matches, getTeamById, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      {/* CABECERA DE ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">
          Resultados
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="font-bold text-xs uppercase border-2">
            <Download className="mr-2 h-4 w-4" /> Descargar Resultados
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase shadow-lg shadow-blue-200">
            <Play className="mr-2 h-4 w-4 fill-current" /> Simular Jornada
          </Button>
        </div>
      </div>

      {/* LISTA DE PARTIDOS */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <ScrollArea className="h-[550px]">
          {matches.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {matches.map((match: any) => {
                const home = getTeamById(match.home_team_id);
                const away = getTeamById(match.away_team_id);
                if (!home || !away) return null;

                return (
                  <div key={match.id} className="group grid grid-cols-[1fr_auto_1fr_auto] items-center p-5 hover:bg-slate-50 transition-all">
                    {/* EQUIPO LOCAL */}
                    <div className="flex items-center justify-end gap-4">
                      <span className="font-bold text-slate-700 text-sm md:text-base">{home.name}</span>
                      <img src={home.badge_url} className="w-10 h-10 object-contain drop-shadow-sm" alt="" />
                    </div>

                    {/* MARCADOR CENTRAL */}
                    <div className="flex items-center px-10">
                      <div className="bg-slate-900 text-white font-black text-xl px-5 py-1.5 rounded-xl min-w-[100px] text-center tracking-widest shadow-inner">
                        {match.played ? `${match.home_goals} - ${match.away_goals}` : "VS"}
                      </div>
                    </div>

                    {/* EQUIPO VISITANTE */}
                    <div className="flex items-center justify-start gap-4">
                      <img src={away.badge_url} className="w-10 h-10 object-contain drop-shadow-sm" alt="" />
                      <span className="font-bold text-slate-700 text-sm md:text-base">{away.name}</span>
                    </div>

                    {/* ACCIONES DEL PARTIDO (ICONO LIBRETA) */}
                    <div className="pl-4">
                       <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                         <FileText className="h-5 w-5" />
                       </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-32 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold italic">Esperando equipos para generar duelos...</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function Calendar(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
  )
}