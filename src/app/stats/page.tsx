"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Asegúrate de tener el componente Button de shadcn
import { Download } from "lucide-react"; // Icono de descarga

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

    // FUNCIÓN PARA DESCARGAR CSV
    const downloadCSV = (type: 'standings' | 'players') => {
        let csvContent = "";
        let fileName = "";

        if (type === 'standings') {
            fileName = "clasificacion_liga_titan.csv";
            // Cabeceras
            csvContent = "Pos,Equipo,PJ,PG,PE,PP,GF,GC,DG,PTS\n";
            // Filas
            data.standings.forEach((s: any, i: number) => {
                const row = [
                    i + 1,
                    s.teams.name,
                    s.played,
                    s.wins,
                    s.draws,
                    s.losses,
                    s.goals_for,
                    s.goals_against,
                    s.goals_for - s.goals_against,
                    s.points
                ].join(",");
                csvContent += row + "\n";
            });
        } else {
            fileName = "goleadores_liga_titan.csv";
            csvContent = "Pos,Jugador,Equipo,Posicion,Goles\n";
            data.topScorers.forEach((p: any, i: number) => {
                const row = [
                    i + 1,
                    p.name,
                    p.teams.name,
                    p.position,
                    p.goals
                ].join(",");
                csvContent += row + "\n";
            });
        }

        // Crear el archivo y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-10 text-center">Cargando Liga Titán...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Estadísticas e Información"
                    description="Clasificación y rendimiento individual de la temporada."
                />
            </div>
            
            <Tabs defaultValue="standings" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="standings">Tabla de Posiciones</TabsTrigger>
                        <TabsTrigger value="players">Líderes Individuales</TabsTrigger>
                    </TabsList>
                    
                    {/* Botones de descarga condicionales */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadCSV('standings')}>
                            <Download className="mr-2 h-4 w-4" /> Exportar Tabla
                        </Button>
                    </div>
                </div>

                <TabsContent value="standings" className="mt-0">
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

                <TabsContent value="players" className="mt-0">
                    <div className="flex justify-end mb-2">
                         <Button variant="ghost" size="sm" onClick={() => downloadCSV('players')}>
                            <Download className="mr-2 h-4 w-4" /> Descargar Goleadores
                        </Button>
                    </div>
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