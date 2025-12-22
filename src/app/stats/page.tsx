"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Componente de Tabla Interno
const PlayerStatsTable = ({ players, statKey, statLabel }: { players: any[], statKey: string, statLabel: string }) => {
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
                    {players.map((player, index) => (
                        <TableRow key={player.id || index}>
                            <TableCell className="font-medium text-center">{index + 1}</TableCell>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={player.teams?.badge_url || '/placeholder-logo.png'} 
                                        alt={player.teams?.name} 
                                        className="w-5 h-5 rounded-full object-contain" 
                                    />
                                    {player.teams?.name || 'Sin Equipo'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{player.position}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-blue-600 text-lg">
                                {player[statKey]}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Llamamos a la API que creamos anteriormente
        fetch("/api/stats/leaders?seasonId=1")
            .then((res) => res.json())
            .then((json) => {
                if (json.ok) {
                    setStats(json.data);
                }
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center">Cargando stats de la Liga Titán...</div>;

    return (
        <div className="container mx-auto py-6">
            <PageHeader
                title="Estadísticas de Jugadores"
                description="Clasificación del rendimiento individual en la Liga Titán."
            />
            
            <Tabs defaultValue="scorers" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="scorers">Máximos Goleadores</TabsTrigger>
                    <TabsTrigger value="assists">Máximos Asistentes</TabsTrigger>
                    <TabsTrigger value="clean-sheets">Porterías a Cero</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scorers" className="mt-6">
                    <PlayerStatsTable players={stats?.topScorers || []} statKey="goals" statLabel="Goles" />
                </TabsContent>
                
                <TabsContent value="assists" className="mt-6">
                    <PlayerStatsTable players={stats?.topAssistants || []} statKey="assists" statLabel="Asistencias" />
                </TabsContent>
                
                <TabsContent value="clean-sheets" className="mt-6">
                    {/* Aquí filtramos los porteros en el servidor o aquí mismo */}
                    <PlayerStatsTable 
                        players={stats?.topScorers?.filter((p: any) => p.clean_sheets !== undefined) || []} 
                        statKey="clean_sheets" 
                        statLabel="Vallas Invictas" 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}