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
    // CONSULTA A TABLA TEAMS: Usamos solo las columnas que me pasaste en tu tabla
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
    
    // CONSULTA A TABLA PLAYERS: Quitamos 'overall' y usamos 'rating', 'nationality' y 'face_url'
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, name, position, nationality, rating, face_url') 
      .eq('team_id', dbTeam.id)
      .limit(20);

    if (playersError) {
      console.error("Error cargando jugadores:", playersError.message);
    }

    // MAPEO AL TIPO 'Team' DE TU TYPES.TS
    const formattedTeam: Team = {
      id: Number(dbTeam.id),
      name: dbTeam.name,
      country: dbTeam.country || "Spain",
      badge_url: dbTeam.badge_url || '/placeholder-team.png',
      logo: dbTeam.badge_url || '/placeholder-team.png', // Tu tabla tiene logo en null, usamos badge_url
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
        // Forzamos el tipo para que coincida con tu interfaz Player
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
          <DialogDescription className="sr-only">
            Busca equipos existentes para añadirlos a tu liga.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar club..." 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Consultando...</p>
              </div>
            ) : (
              results.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border-2 rounded-xl border-slate-100 hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 bg-white rounded-lg p-1 border shadow-sm flex items-center justify-center overflow-hidden">
                      <img 
                        src={t.badge_url || '/placeholder-team.png'} 
                        alt="" 
                        className="object-contain max-h-full max-w-full"
                        onError={(e) => { (e.currentTarget.src = '/placeholder-team.png'); }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black">
                        <Globe className="inline h-2 w-2 mr-1" /> {t.country || 'Spain'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={importing === t.id}
                    onClick={() => handleImport(t)} 
                    className="bg-blue-600 hover:bg-blue-700 font-bold h-8"
                  >
                    {importing === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}