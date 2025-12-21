"use client";
import Image from "next/image";
import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Player } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { LeagueContext } from "@/context/league-context";

const PlayerStatsTable = ({ players, statKey, statLabel }: { players: Player[], statKey: 'goals' | 'assists' | 'cleanSheets', statLabel: string }) => {
    const { getTeamByPlayerId, isLoaded } = useContext(LeagueContext);

    if (!isLoaded) {
      return null;
    }
    
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead>Posición</TableHead>
                        <TableHead className="text-center">{statLabel}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player, index) => {
                        const team = getTeamByPlayerId(player.id);
                        return (
                        <TableRow key={player.id}>
                            <TableCell className="font-medium text-center">{index + 1}</TableCell>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>
                                {team && (
                                    <div className="flex items-center gap-2">
                                        <Image src={team.logoUrl} alt={team.name} width={20} height={20} className="rounded-full" data-ai-hint={team.dataAiHint} />
                                        {team.name}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{player.position}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold">{player.stats[statKey]}</TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </Card>
    )
}

export default function StatsPage() {
  const { players, isLoaded } = useContext(LeagueContext);
  
  if (!isLoaded) {
    return <div>Cargando...</div>
  }

  const topScorers = [...players].sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 20);
  const topAssists = [...players].sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 20);
  const topCleanSheets = [...players].filter(p => p.position === 'Goalkeeper').sort((a, b) => b.stats.cleanSheets - a.stats.cleanSheets).slice(0, 10);

  return (
    <>
      <PageHeader
        title="Estadísticas de Jugadores"
        description="Clasificación del rendimiento individual en la Liga Titán."
      />
       <Tabs defaultValue="scorers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scorers">Máximos Goleadores</TabsTrigger>
          <TabsTrigger value="assists">Máximos Asistentes</TabsTrigger>
          <TabsTrigger value="clean-sheets">Porterías a Cero</TabsTrigger>
        </TabsList>
        <TabsContent value="scorers" className="mt-6">
          <PlayerStatsTable players={topScorers} statKey="goals" statLabel="Goles" />
        </TabsContent>
        <TabsContent value="assists" className="mt-6">
          <PlayerStatsTable players={topAssists} statKey="assists" statLabel="Asistencias" />
        </TabsContent>
        <TabsContent value="clean-sheets" className="mt-6">
            <PlayerStatsTable players={topCleanSheets} statKey="cleanSheets" statLabel="Porterías a Cero" />
        </TabsContent>
      </Tabs>
    </>
  );
}
