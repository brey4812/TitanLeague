"use client";
import { useState, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, User, Loader2 } from "lucide-react";
import { Player } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RosterManagementDialog({ 
  teamId, 
  isOpen, 
  onOpenChange 
}: { 
  teamId: number, 
  isOpen: boolean, 
  onOpenChange: (o: boolean) => void 
}) {
  const { teams, addPlayerToTeam, removePlayerFromTeam } = useContext(LeagueContext);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const team = teams.find(t => t.id === teamId);
  const rosterCount = team?.roster.length || 0;

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
      alert("El equipo ya tiene el límite de 20 jugadores.");
      return;
    }

    // Evitar duplicados
    if (team?.roster.some(player => player.id === p.id)) {
      alert("Este jugador ya está en el equipo.");
      return;
    }

    // Mapeo seguro para evitar errores de TypeScript
    const newPlayer: Player = {
      id: p.id,
      name: p.name,
      nationality: p.nationality || "Desconocida",
      // Cast de posición para asegurar compatibilidad con el ENUM de tipos
      position: (p.position as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward') || 'Midfielder',
      // Resolvemos el error de rating/overall
      rating: Number(p.rating || p.overall || 70),
      image_url: p.image_url || null,
      stats: { 
        goals: 0, 
        assists: 0, 
        cleanSheets: 0, 
        cards: { yellow: 0, red: 0 }, 
        mvp: 0 
      }
    };

    addPlayerToTeam(teamId, newPlayer);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-6">
            <span>Plantilla: {team?.name}</span>
            <span className={`text-sm ${rosterCount >= 20 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
              {rosterCount}/20
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex flex-col mt-2">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar jugadores en la base de datos..." 
              value={search} 
              onChange={(e) => handleSearchPlayers(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          
          {/* Resultados de Supabase */}
          <div className="space-y-2">
            {loading && <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {results.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 border rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white border flex items-center justify-center overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-300" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{p.position} • {p.nationality}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => addPlayer(p)} 
                  disabled={rosterCount >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex-grow overflow-y-auto">
            <p className="font-bold text-sm mb-3 text-slate-700">Jugadores en el club</p>
            {team?.roster.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground text-xs">
                No hay jugadores inscritos todavía.
              </div>
            ) : (
              <div className="grid gap-1">
                {team?.roster.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-8 text-center">
                        {p.position.substring(0, 3).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removePlayerFromTeam(teamId, p.id)}
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