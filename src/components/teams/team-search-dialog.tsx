"use client";

import { useState, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Globe, PlusCircle, Loader2 } from "lucide-react";
import { Team } from "@/lib/types";

// Inicialización de Supabase
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
  const [importing, setImporting] = useState<string | number | null>(null);
  const { addTeam } = useContext(LeagueContext);

  const handleSearch = async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    // 1. Consulta optimizada: Traemos solo lo necesario de la tabla 'teams'
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, country, badge_url, league, real_team_name, external_id, division_id, attack, midfield, defense, overall')
      .ilike('name', `%${term}%`)
      .limit(6);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  const handleImport = async (dbTeam: any) => {
    setImporting(dbTeam.id);
    
    // 2. Consulta a la tabla 'players': Aseguramos que las columnas existen en tu DB
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, name, position, nationality, rating, face_url') 
      .eq('team_id', dbTeam.id)
      .limit(20);

    if (playersError) {
      console.error("Error cargando jugadores:", playersError.message);
    }

    // 3. Mapeo estricto al objeto Team (evita el error 'formattedTeam')
    const formattedTeam: Team = {
      id: Number(dbTeam.id),
      name: dbTeam.name,
      country: dbTeam.country || "Spain",
      badge_url: dbTeam.badge_url || '/placeholder-team.png',
      logo: dbTeam.badge_url || '/placeholder-team.png', 
      overall: Number(dbTeam.overall || 70),
      attack: Number(dbTeam.attack || 70),
      midfield: Number(dbTeam.midfield || 70),
      defense: Number(dbTeam.defense || 70),
      real_team_name: dbTeam.real_team_name || dbTeam.name,
      league: dbTeam.league || "Spanish La Liga",
      external_id: String(dbTeam.external_id || dbTeam.id),
      division_id: Number(dbTeam.division_id || 1),
      divisionName: "Primera División",
      stats: {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      },
      roster: playersData ? playersData.map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        // Cast de posición para que coincida con el tipo literal de Player
        position: (p.position || 'Midfielder') as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward',
        nationality: p.nationality || "Spain",
        rating: Number(p.rating || 75),
        face_url: p.face_url || undefined,
        stats: {
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          cards: { yellow: 0, red: 0 },
          mvp: 0
        }
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
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Search className="h-5 w-5" /> Importar desde DB
          </DialogTitle>
          {/* CORRECCIÓN: DialogDescription obligatoria para quitar el Warning de consola */}
          <DialogDescription className="text-xs text-muted-foreground">
            Buscador de equipos oficiales. Los datos se sincronizarán con tu liga local.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar club por nombre..." 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
                <p className="text-sm font-medium">Conectando con Supabase...</p>
              </div>
            ) : (
              results.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border-2 rounded-xl border-slate-100 hover:bg-blue-50/40 transition-all group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative h-12 w-12 bg-white rounded-lg p-1 border shadow-sm flex items-center justify-center shrink-0">
                      {/* CORRECCIÓN: Usamos img nativo con onError para evitar el Error 400 de Next/Image */}
                      <img 
                        src={t.badge_url || '/placeholder-team.png'} 
                        alt="" 
                        className="object-contain max-h-full max-w-full"
                        onError={(e) => { 
                          (e.currentTarget as HTMLImageElement).src = '/placeholder-team.png'; 
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-black flex items-center gap-1">
                        <Globe className="h-2.5 w-2.5" /> {t.country || 'España'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={importing === t.id}
                    onClick={() => handleImport(t)} 
                    className="bg-blue-600 hover:bg-blue-700 font-bold h-9 px-4 ml-2"
                  >
                    {importing === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <PlusCircle className="h-4 w-4" />
                        <span>Importar</span>
                      </div>
                    )}
                  </Button>
                </div>
              ))
            )}
            
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground text-sm italic">
                No se encontraron clubes para "{query}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}