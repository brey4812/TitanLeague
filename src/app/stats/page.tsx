"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch("/api/stats/leaders?seasonId=1");
                const json = await res.json();
                if (json.ok) setData(json.data);
            } catch (error) {
                console.error("Error cargando estadísticas:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-center">Cargando Liga Titán...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title="Estadísticas e Información"
                description="Clasificación y rendimiento individual de la temporada."
            />
            
            <Tabs defaultValue="standings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standings">Tabla de Posiciones</TabsTrigger>
                    <TabsTrigger value="players">Líderes Individuales</TabsTrigger>
                </TabsList>

                {/* CONTENIDO: TABLA DE POSICIONES */}
                <TabsContent value="standings" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center font-bold">Pos</TableHead>
                                    <TableHead className="font-bold">Equipo</TableHead>
                                    <TableHead className="text-center font-bold">PJ</TableHead>
                                    <TableHead className="text-center font-bold">DG</TableHead>
                                    <TableHead className="text-center font-bold text-blue-600">PTS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.standings.map((team: any, i: number) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="text-center font-medium">{i + 1}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <img src={team.teams.badge_url} alt="logo" className="w-6 h-6 object-contain" />
                                            <span className="font-semibold">{team.teams.name}</span>
                                        </TableCell>
                                        <TableCell className="text-center">{team.played}</TableCell>
                                        <TableCell className="text-center">{team.goals_for - team.goals_against}</TableCell>
                                        <TableCell className="text-center font-black text-blue-700">{team.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* CONTENIDO: GOLEADORES */}
                <TabsContent value="players" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center font-bold">#</TableHead>
                                    <TableHead className="font-bold">Jugador</TableHead>
                                    <TableHead className="font-bold">Equipo</TableHead>
                                    <TableHead className="text-center font-bold text-orange-600">Goles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.topScorers.map((player: any, i: number) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="text-center font-medium">{i + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-bold">{player.name}</div>
                                            <Badge variant="outline" className="text-[10px]">{player.position}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{player.teams.name}</TableCell>
                                        <TableCell className="text-center font-bold text-lg">{player.goals}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}