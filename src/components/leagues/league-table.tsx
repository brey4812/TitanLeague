import Image from "next/image";
import type { Division } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";

interface LeagueTableProps {
  division: Division;
}

export function LeagueTable({ division }: LeagueTableProps) {
  const sortedTeams = [...division.teams].sort((a, b) => {
    const pointsA = a.stats.wins * 3 + a.stats.draws;
    const pointsB = b.stats.wins * 3 + b.stats.draws;
    if (pointsA !== pointsB) return pointsB - pointsA;
    const gdA = a.stats.goalsFor - a.stats.goalsAgainst;
    const gdB = b.stats.goalsFor - b.stats.goalsAgainst;
    if (gdA !== gdB) return gdB - gdA;
    return b.stats.goalsFor - a.stats.goalsFor;
  });

  return (
    <div id={`league-table-${division.id}`} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center px-2">#</TableHead>
            <TableHead className="min-w-[150px]">Equipo</TableHead>
            <TableHead className="text-center px-2">PJ</TableHead>
            <TableHead className="text-center px-2">V</TableHead>
            <TableHead className="text-center px-2">E</TableHead>
            <TableHead className="text-center px-2">D</TableHead>
            <TableHead className="text-center px-2">GF</TableHead>
            <TableHead className="text-center px-2">GC</TableHead>
            <TableHead className="text-center px-2">DG</TableHead>
            <TableHead className="text-center font-bold px-2">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => {
            const points = team.stats.wins * 3 + team.stats.draws;
            const goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium text-center px-2">{index + 1}</TableCell>
                <TableCell className="px-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={team.logoUrl}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                      data-ai-hint={team.dataAiHint}
                    />
                    <span className="font-medium truncate">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center px-2">{team.stats.wins + team.stats.draws + team.stats.losses}</TableCell>
                <TableCell className="text-center px-2">{team.stats.wins}</TableCell>
                <TableCell className="text-center px-2">{team.stats.draws}</TableCell>
                <TableCell className="text-center px-2">{team.stats.losses}</TableCell>
                <TableCell className="text-center px-2">{team.stats.goalsFor}</TableCell>
                <TableCell className="text-center px-2">{team.stats.goalsAgainst}</TableCell>
                <TableCell className="text-center px-2">
                  <Badge variant={goalDifference > 0 ? "default" : goalDifference < 0 ? "destructive" : "secondary"} className="w-8 justify-center">
                    {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold px-2">{points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
