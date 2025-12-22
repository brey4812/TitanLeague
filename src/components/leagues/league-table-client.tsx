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
  teams: Team[]; // Recibimos los equipos filtrados desde la página
}

export function LeagueTableClient({ division, teams }: LeagueTableClientProps) {
  const calculatePoints = (team: Team) => (team.stats.wins * 3) + team.stats.draws;
  const goalDiff = (team: Team) => team.stats.goalsFor - team.stats.goalsAgainst;

  // Corregido: Usamos el array 'teams' que viene de las props
  const sortedTeams = [...teams].sort((a, b) => {
    const pointsA = calculatePoints(a);
    const pointsB = calculatePoints(b);
    if (pointsB !== pointsA) return pointsB - pointsA;
    
    const diffA = goalDiff(a);
    const diffB = goalDiff(b);
    if (diffB !== diffA) return diffB - diffA;
    
    return b.stats.goalsFor - a.stats.goalsFor;
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
            const pj = team.stats.wins + team.stats.draws + team.stats.losses;
            const pts = calculatePoints(team);
            const dg = goalDiff(team);

            return (
              <TableRow key={team.id} className="hover:bg-slate-50/50">
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
                <TableCell className="text-center text-green-600">{team.stats.wins}</TableCell>
                <TableCell className="text-center text-slate-500">{team.stats.draws}</TableCell>
                <TableCell className="text-center text-red-600">{team.stats.losses}</TableCell>
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
    </div>
  );
}