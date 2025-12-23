"use client";

import { useState, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Globe, PlusCircle, Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function TeamSearchDialog({ 
  isOpen, 
  onOpenChange 
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null); // Nuevo: estado para carga de importación
  const { addTeam } = useContext(LeagueContext);

  const handleSearch = async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', `%${term}%`)
      .limit(6);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  const handleImport = async (dbTeam: any) => {
    setImporting(dbTeam.id);
    
    // 1. Buscamos los jugadores asociados a este equipo en la DB
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', dbTeam.id)
      .limit(20); // Respetamos tu límite de 20

    if (playersError) {
      console.error("Error cargando jugadores:", playersError);
    }

    // 2. Adaptamos los datos al estado de la liga
    const formattedTeam = {
      ...dbTeam,
      // Priorizamos badge_url de la DB, luego logo, si no hay, placeholder
      badge_url: dbTeam.badge_url || dbTeam.logo || '/placeholder-team.png',
      stats: {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      },
      // 3. Mapeamos los jugadores encontrados o array vacío si no hay
      roster: playersData ? playersData.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position || 'Desconocido',
        overall: p.overall || 60,
        image_url: p.image_url || null // La imagen del jugador es opcional
      })) : []
    };

    addTeam(formattedTeam);
    setImporting(null);
    onOpenChange(false); 
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Search className="h-5 w-5" /> Base de Datos de Clubes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Escribe el club que buscas..." 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground font-medium">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Consultando Base de Datos...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((t) => (
                <div 
                  key={t.id} 
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-all border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 bg-white rounded-lg border p-1 shadow-sm flex items-center justify-center">
                      <img 
                        src={t.badge_url || t.logo || '/placeholder-team.png'} 
                        alt={t.name} 
                        className="object-contain max-h-full max-w-full" 
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate text-slate-900 leading-tight">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 uppercase font-semibold">
                        <Globe className="h-2.5 w-2.5" /> {t.country || 'Sin País'} • {t.league || 'Sin Liga'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={importing === t.id}
                    onClick={() => handleImport(t)} 
                    className="gap-1 h-8 bg-blue-600 hover:bg-blue-700"
                  >
                    {importing === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5" />
                    )}
                    {importing === t.id ? 'Cargando...' : 'Importar'}
                  </Button>
                </div>
              ))
            ) : query.length > 2 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                No hay coincidencias para "{query}"
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}