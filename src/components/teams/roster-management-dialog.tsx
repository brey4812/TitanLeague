"use client";
import { useState, useContext, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Player } from "@/lib/types";
import { toast } from "sonner";

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
  
  const team = teams.find(t => String(t.id) === String(teamId));
  const rosterCount = team?.roster.length || 0;

  // IDs de todos los jugadores que ya tienen equipo en la liga actual
  const allOccupiedIds = useMemo(() => {
    return new Set(teams.flatMap(t => t.roster?.map(p => p.id) || []));
  }, [teams]);

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

  const addPlayer = (p: any) => {
    if (rosterCount >= 20) {
      toast.error("Límite de 20 jugadores alcanzado.");
      return;
    }

    if (allOccupiedIds.has(p.id)) {
      toast.warning("Este jugador ya está inscrito en otro club de la liga.");
      return;
    }

    // CORRECCIÓN DE ERROR TYPESCRIPT (nationality)
    const newPlayer: Player = {
      id: p.id,
      name: p.name,
      // Usamos 'as any' para evitar que TS bloquee la propiedad si no está en la interfaz Player
      ...({ nationality: p.nationality || p.country || "Spain" } as any),
      position: (p.position as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward') || 'Midfielder',
      rating: Number(p.rating || p.overall || 70),
      image_url: p.image_url || null,
      stats: { 
        goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 
      }
    } as Player;

    addPlayerToTeam(Number(teamId), newPlayer);
    toast.success(`${p.name} se ha unido a la plantilla.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] flex flex-col max-h-[90vh] p-0 overflow-hidden border-2 shadow-2xl">
        <DialogHeader className="p-6 pb-2 shrink-0 bg-white z-20 border-b">
          <DialogTitle className="flex justify-between items-center pr-6">
            <span className="font-black uppercase italic tracking-tighter text-xl text-slate-800">Gestionar Plantilla</span>
            <span className={`text-[10px] font-black py-1 px-3 rounded-full uppercase tracking-widest ${rosterCount >= 20 ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
              {rosterCount}/20 Cupos
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-400 uppercase italic">
            Ficha nuevas estrellas para el {team?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 flex flex-col flex-1 overflow-hidden">
          {/* BUSCADOR */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar jugador libre..." 
              value={search} 
              onChange={(e) => handleSearchPlayers(e.target.value)}
              className="pl-10 h-12 bg-slate-50 border-2 border-slate-100 focus-visible:ring-blue-500 font-medium"
            />
          </div>
          
          {/* RESULTADOS DE BÚSQUEDA (Con scroll independiente) */}
          <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2 custom-scrollbar shrink-0">
            {loading ? (
              <div className="flex flex-col items-center py-6 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">Consultando Scout...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(p => {
                const isOccupied = allOccupiedIds.has(p.id);
                return (
                  <div key={p.id} className={`flex justify-between items-center p-3 border-2 rounded-xl transition-all ${isOccupied ? 'opacity-50 bg-slate-50' : 'bg-white hover:border-blue-300 shadow-sm'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm shrink-0">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-300 m-2" />}
                      </div>
                      <div className="truncate">
                        <p className="font-black text-xs text-slate-900 truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">
                          {p.position} • {p.rating || p.overall} OVR
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => addPlayer(p)} 
                      disabled={rosterCount >= 20 || isOccupied}
                      className={`h-9 px-4 rounded-lg font-black uppercase text-[10px] shrink-0 ${isOccupied ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                    >
                      {isOccupied ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-1" />}
                      {isOccupied ? 'Ocupado' : 'Fichar'}
                    </Button>
                  </div>
                );
              })
            ) : search.length >= 2 && (
              <div className="text-center py-6 text-slate-400">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest italic tracking-tight">No se encontraron jugadores disponibles</p>
              </div>
            )}
          </div>

          {/* LISTADO DE LA PLANTILLA ACTUAL (Scroll independiente) */}
          <div className="flex-1 flex flex-col overflow-hidden border-t-4 border-slate-900 pt-4 mt-2">
            <p className="font-black text-[10px] mb-3 text-slate-500 uppercase tracking-[0.2em] italic">Jugadores Inscritos</p>
            
            <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {team?.roster.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin jugadores en plantilla</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {team?.roster.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border-2 border-transparent hover:border-red-100 group transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black bg-white border-2 border-slate-100 text-slate-500 px-2 py-1 rounded shadow-sm w-10 text-center">
                          {p.position.substring(0, 3).toUpperCase()}
                        </span>
                        <span className="text-xs font-black uppercase italic text-slate-700">{p.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => removePlayerFromTeam(Number(teamId), Number(p.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PIE DE MODAL FIJO */}
        <div className="p-4 bg-slate-50 border-t shrink-0">
           <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full font-black uppercase text-[10px] tracking-widest h-10 border-2">
              Finalizar Gestión
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}