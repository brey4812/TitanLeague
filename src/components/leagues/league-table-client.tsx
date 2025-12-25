"use client";

import Image from "next/image";
import { Team, Division } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeagueTableClientProps {
  division: Division;
  teams: Team[];
}

export function LeagueTableClient({ division, teams }: LeagueTableClientProps) {
  // CORRECCIÓN: Funciones blindadas contra undefined
  const calculatePoints = (team: Team) => 
    ((team.stats?.wins || 0) * 3) + (team.stats?.draws || 0);

  const goalDiff = (team: Team) => 
    (team.stats?.goalsFor || 0) - (team.stats?.goalsAgainst || 0);

  const sortedTeams = [...teams].sort((a, b) => {
    const pointsA = calculatePoints(a);
    const pointsB = calculatePoints(b);
    if (pointsB !== pointsA) return pointsB - pointsA;
    
    const diffA = goalDiff(a);
    const diffB = goalDiff(b);
    if (diffB !== diffA) return diffB - diffA;
    
    return (b.stats?.goalsFor || 0) - (a.stats?.goalsFor || 0);
  });

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 text-center font-bold">Pos</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center font-bold">PJ</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">E</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">DG</TableHead>
            <TableHead className="text-center font-black text-blue-600">PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => {
            // CORRECCIÓN: Acceso seguro con fallback a 0
            const pj = (team.stats?.wins || 0) + (team.stats?.draws || 0) + (team.stats?.losses || 0);
            const pts = calculatePoints(team);
            const dg = goalDiff(team);

            // --- LÓGICA DE INDICADORES VISUALES ---
            let rowStyle = "hover:bg-slate-50/50 transition-colors";
            
            if (division.id === 1) {
              // Clasificación internacional (Blue: Champions, Orange: Shield)
              if (index < 4) rowStyle += " border-l-4 border-l-blue-600 bg-blue-50/20"; 
              else if (index >= 4 && index < 8) rowStyle += " border-l-4 border-l-orange-400 bg-orange-50/10";
              else if (index >= sortedTeams.length - 2 && sortedTeams.length > 4) rowStyle += " border-l-4 border-l-red-500 bg-red-50/10";
            } else {
              // Ascensos y descensos
              if (index < 2) rowStyle += " border-l-4 border-l-green-600 bg-green-50/20";
              else if (index >= sortedTeams.length - 2 && sortedTeams.length > 4 && division.id !== 4) {
                rowStyle += " border-l-4 border-l-red-500 bg-red-50/10";
              }
            }

            return (
              <TableRow key={team.id} className={rowStyle}>
                <TableCell className="text-center font-medium italic text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-bold">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 shrink-0">
                      <Image
                        src={team.badge_url || '/placeholder-team.png'}
                        alt={team.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[150px]">{team.name}</span>
                      <span className="text-[10px] text-muted-foreground font-normal uppercase">{team.country}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">{pj}</TableCell>
                <TableCell className="text-center text-green-600">{team.stats?.wins || 0}</TableCell>
                <TableCell className="text-center text-slate-500">{team.stats?.draws || 0}</TableCell>
                <TableCell className="text-center text-red-600">{team.stats?.losses || 0}</TableCell>
                <TableCell className={`text-center font-bold ${dg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dg > 0 ? `+${dg}` : dg}
                </TableCell>
                <TableCell className="text-center font-black text-blue-700 bg-blue-50/30">
                  {pts}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* LEYENDA INFORMATIVA */}
      <div className="p-3 bg-slate-50 border-t flex flex-wrap gap-4 text-[10px] font-bold uppercase text-muted-foreground">
        {division.id === 1 ? (
          <>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-600 rounded-full" /> The Titan Peak</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full" /> Colossus Shield</div>
          </>
        ) : (
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-600 rounded-full" /> Zona de Ascenso</div>
        )}
      </div>
    </div>
  );
}