"use client";
import { useState, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, User, Loader2 } from "lucide-react";
import { Player } from "@/lib/types";

// Inicialización de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RosterManagementDialog({ 
  teamId, 
  isOpen, 
  onOpenChange 
}: { 
  teamId: number | string, 
  isOpen: boolean, 
  onOpenChange: (o: boolean) => void 
}) {
  const { teams, addPlayerToTeam, removePlayerFromTeam } = useContext(LeagueContext);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Buscamos el equipo actual en el contexto
  const team = teams.find(t => String(t.id) === String(teamId));
  const rosterCount = team?.roster.length || 0;

  // Manejador de búsqueda en la base de datos de jugadores
  const handleSearchPlayers = async (val: string) => {
    setSearch(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${val}%`)
      .limit(5);
    
    if (!error) setResults(data || []);
    setLoading(false);
  };

  // Función para agregar jugador al equipo local
  const addPlayer = (p: any) => {
    // 1. Validar límite estricto de 20
    if (rosterCount >= 20) {
      alert("El equipo ya tiene el límite de 20 jugadores.");
      return;
    }

    // 2. Evitar que el mismo jugador esté dos veces en la plantilla
    if (team?.roster.some(player => String(player.id) === String(p.id))) {
      alert("Este jugador ya está en el equipo.");
      return;
    }

    // 3. Formatear el objeto jugador para que coincida con tu sistema
    const newPlayer: Player = {
      id: p.id,
      name: p.name,
      nationality: p.nationality || "Desconocida",
      // Aseguramos que la posición sea válida para el sistema de simulación
      position: (p.position as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward') || 'Midfielder',
      // Unificamos rating y overall (usa 70 por defecto si no hay datos)
      rating: Number(p.rating || p.overall || 70),
      image_url: p.image_url || null,
      // Inicializamos estadísticas a cero para evitar errores en la tabla de goleadores
      stats: { 
        goals: 0, 
        assists: 0, 
        cleanSheets: 0, 
        cards: { yellow: 0, red: 0 }, 
        mvp: 0 
      }
    };

    addPlayerToTeam(teamId as number, newPlayer);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] flex flex-col max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex justify-between items-center pr-6">
            <span>Plantilla: {team?.name}</span>
            <span className={`text-sm py-1 px-3 rounded-full ${rosterCount >= 20 ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-600'}`}>
              {rosterCount}/20 Jugadores
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 flex flex-col overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar jugador por nombre en la base de datos..." 
              value={search} 
              onChange={(e) => handleSearchPlayers(e.target.value)}
              className="pl-9 h-11 bg-slate-50 border-slate-200"
            />
          </div>
          
          {/* Resultados de búsqueda en Supabase */}
          <div className="space-y-2 min-h-[120px]">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : results.length > 0 ? (
              results.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-300" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">{p.position} • {p.nationality}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full" 
                    onClick={() => addPlayer(p)} 
                    disabled={rosterCount >= 20}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : search.length >= 2 && (
              <p className="text-center py-4 text-xs text-muted-foreground italic">No se encontraron jugadores con ese nombre.</p>
            )}
          </div>

          {/* Listado de la plantilla actual */}
          <div className="border-t pt-4 flex-grow overflow-y-auto custom-scrollbar">
            <p className="font-bold text-xs mb-3 text-slate-500 uppercase tracking-wider">Jugadores inscritos</p>
            {team?.roster.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground text-xs bg-slate-50/50">
                Este equipo aún no tiene jugadores. <br/> Busca arriba para añadir nuevas estrellas.
              </div>
            ) : (
              <div className="grid gap-1.5">
                {team?.roster.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-red-100 group transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded shadow-sm w-9 text-center">
                        {p.position.substring(0, 3).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePlayerFromTeam(teamId as number, p.id as number)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}