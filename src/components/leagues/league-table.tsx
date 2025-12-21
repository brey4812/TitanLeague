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
    <div id={`league-table-${division.id}`} className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center">PJ</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">E</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GC</TableHead>
            <TableHead className="text-center">DG</TableHead>
            <TableHead className="text-center">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => {
            const points = team.stats.wins * 3 + team.stats.draws;
            const goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium text-center">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={team.logoUrl}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                      data-ai-hint={team.dataAiHint}
                    />
                    <span className="font-medium">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{team.stats.wins + team.stats.draws + team.stats.losses}</TableCell>
                <TableCell className="text-center">{team.stats.wins}</TableCell>
                <TableCell className="text-center">{team.stats.draws}</TableCell>
                <TableCell className="text-center">{team.stats.losses}</TableCell>
                <TableCell className="text-center">{team.stats.goalsFor}</TableCell>
                <TableCell className="text-center">{team.stats.goalsAgainst}</TableCell>
                <TableCell className="text-center">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</TableCell>
                <TableCell className="text-center font-bold">{points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
