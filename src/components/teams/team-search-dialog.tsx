"use client";

import { useState, useContext, useMemo } from "react";
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
import { Search, Globe, PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { Team, Player } from "@/lib/types";
import { toast } from "sonner";

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
  
  // Obtenemos teams y addTeam para validar duplicados
  const { addTeam, teams } = useContext(LeagueContext);

  // Mapeamos todos los IDs de jugadores que ya tienen equipo en la liga actual
  const occupiedPlayerIds = useMemo(() => {
    return new Set(teams.flatMap(t => t.roster?.map(p => p.id) || []));
  }, [teams]);

  const handleSearch = async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
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
    // Verificamos si el equipo ya existe para evitar duplicar el club entero
    if (teams.some(t => t.id === Number(dbTeam.id) || t.name === dbTeam.name)) {
        toast.error("Este equipo ya forma parte de tu liga.");
        return;
    }

    setImporting(dbTeam.id);
    
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, name, position, nationality, rating, face_url') 
      .eq('team_id', dbTeam.id)
      .limit(25); // Traemos un poco más para tener margen de filtrado

    if (playersError) {
      console.error("Error cargando jugadores:", playersError.message);
      setImporting(null);
      return;
    }

    // --- FILTRADO DE JUGADORES DUPLICADOS ---
    // Solo permitimos jugadores que NO estén en el Set de IDs ocupados
    const availablePlayers = playersData?.filter((p: any) => !occupiedPlayerIds.has(Number(p.id))) || [];
    const duplicatedCount = (playersData?.length || 0) - availablePlayers.length;

    if (availablePlayers.length < 11) {
        toast.warning(`Atención: Este equipo solo tiene ${availablePlayers.length} jugadores libres. El resto ya están en otros equipos.`);
    }

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
      stats: { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      roster: availablePlayers.map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        position: (p.position || 'Midfielder') as 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward',
        nationality: p.nationality || "Spain",
        rating: Number(p.rating || 75),
        face_url: p.face_url || undefined,
        stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
      }))
    };

    addTeam(formattedTeam);
    
    if (duplicatedCount > 0) {
        toast.info(`Se han omitido ${duplicatedCount} jugadores que ya pertenecen a otros equipos.`);
    } else {
        toast.success(`${dbTeam.name} importado correctamente.`);
    }

    setImporting(null);
    onOpenChange(false); 
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Search className="h-5 w-5" /> Importar desde Base de Datos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Buscador oficial. No se importarán jugadores que ya pertenezcan a otros clubes de tu liga.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2 flex-1 flex flex-col overflow-hidden">
          <div className="relative shrink-0 z-10">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Escribe el nombre del club (ej: Real Madrid, Bayern...)" 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 focus-visible:ring-blue-500 shadow-sm"
            />
          </div>

          {/* LISTA DE RESULTADOS CON SCROLL INDEPENDIENTE */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
                <p className="text-sm font-medium tracking-tight">Sincronizando con el servidor...</p>
              </div>
            ) : (
              results.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border-2 rounded-xl border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative h-12 w-12 bg-white rounded-lg p-1 border shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                        <Globe className="h-2.5 w-2.5" /> {t.country || 'International'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={importing === t.id}
                    onClick={() => handleImport(t)} 
                    className="bg-blue-600 hover:bg-blue-700 font-bold h-9 px-4 ml-2 shrink-0 shadow-md active:scale-95 transition-transform"
                  >
                    {importing === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <PlusCircle className="h-4 w-4" />
                        <span>Fichar</span>
                      </div>
                    )}
                  </Button>
                </div>
              ))
            )}
            
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50/50">
                <AlertCircle className="h-6 w-6 mb-2 opacity-20" />
                <p className="text-sm italic font-medium">No hay resultados para "{query}"</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}