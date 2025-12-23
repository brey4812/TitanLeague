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
// Importamos los tipos para asegurar la compatibilidad
import { Team, Player } from "@/lib/types";

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
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, country, badge_url, league, real_team_name, external_id, division_id')
      .ilike('name', `%${term}%`)
      .limit(6);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  const handleImport = async (dbTeam: any) => {
    setImporting(dbTeam.id);
    
    // 1. Buscamos jugadores con las columnas de tu tabla
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, name, position, nationality, face_url, rating')
      .eq('team_id', dbTeam.id)
      .limit(20);

    if (playersError) {
      console.error("Error cargando jugadores:", playersError.message);
    }

    // 2. Construcción del objeto siguiendo la interfaz Team
    const formattedTeam: Team = {
      id: Number(dbTeam.id),
      name: dbTeam.name,
      country: dbTeam.country || "Spain",
      badge_url: dbTeam.badge_url || '/placeholder-team.png',
      logo: dbTeam.badge_url || '/placeholder-team.png',
      overall: 75,
      attack: 75,
      midfield: 75,
      defense: 75,
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
      // Mapeo de jugadores siguiendo la interfaz Player
      roster: playersData ? playersData.map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        // Cast de posición para cumplir con el Literal Type de tu interfaz
        position: (p.position || 'Midfielder') as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward',
        country: p.nationality || "Spain",
        face_url: p.face_url || undefined,
        rating: Number(p.rating || 75),
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
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Search className="h-5 w-5 text-blue-600" /> Mercado de Clubes
          </DialogTitle>
          <DialogDescription className="sr-only">
            Busca e importa equipos reales a tu liga personalizada.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Ej: Real Madrid, Barcelona..." 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 border-2 focus:border-blue-500"
            />
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
                <p>Buscando en la base de datos...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((t) => (
                <div 
                  key={t.id} 
                  className="flex items-center justify-between p-3 border-2 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 bg-white rounded-lg p-1 flex items-center justify-center border shadow-sm">
                      <img 
                        src={t.badge_url || '/placeholder-team.png'} 
                        alt="" 
                        className="object-contain max-h-full max-w-full"
                        onError={(e) => {(e.currentTarget.src = '/placeholder-team.png')}}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black">
                        {t.country || 'España'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={importing === t.id}
                    onClick={() => handleImport(t)} 
                    className="bg-blue-600 hover:bg-blue-700 font-bold"
                  >
                    {importing === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Importar'
                    )}
                  </Button>
                </div>
              ))
            ) : query.length > 2 && (
              <div className="text-center py-10 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                No hay resultados para "{query}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}