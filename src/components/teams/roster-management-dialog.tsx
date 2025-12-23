"use client";
import { useState, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { Player } from "@/lib/types";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function RosterManagementDialog({ teamId, isOpen, onOpenChange }: { teamId: number, isOpen: boolean, onOpenChange: (o: boolean) => void }) {
  const { teams, addPlayerToTeam, removePlayerFromTeam } = useContext(LeagueContext);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  
  const team = teams.find(t => t.id === teamId);
  const rosterCount = team?.roster.length || 0;

  const handleSearchPlayers = async (val: string) => {
    setSearch(val);
    if (val.length < 2) return;
    const { data } = await supabase.from('players').select('*').ilike('name', `%${val}%`).limit(5);
    setResults(data || []);
  };

  const addPlayer = (p: any) => {
    if (rosterCount >= 20) {
        alert("El equipo ya tiene el límite de 20 jugadores.");
        return;
    }
    const newPlayer: Player = {
        id: p.id,
        name: p.name,
        nationality: p.nationality || "Desconocida",
        position: p.position,
        rating: p.rating || 70,
        image_url: p.image_url,
        stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
    };
    addPlayerToTeam(teamId, newPlayer);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar Roster ({rosterCount}/20)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Buscar jugador en DB..." value={search} onChange={(e) => handleSearchPlayers(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {results.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-bold text-sm">{p.name} <span className="text-muted-foreground text-[10px]">({p.position})</span></p>
                  <p className="text-[10px]">{p.nationality}</p>
                </div>
                <Button size="sm" onClick={() => addPlayer(p)} disabled={rosterCount >= 20}><Plus className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="font-bold mb-2">Jugadores Actuales</p>
            {team?.roster.map(p => (
              <div key={p.id} className="flex justify-between items-center py-1 border-b">
                <span className="text-sm">{p.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removePlayerFromTeam(teamId, p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}