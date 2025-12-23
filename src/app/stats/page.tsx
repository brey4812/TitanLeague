"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, ShieldAlert, Ban, Loader2, Download } from "lucide-react";

export default function StatsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Consultamos tu API de líderes
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

    // FUNCIÓN DE DESCARGA REINTEGRADA
    const downloadCSV = (type: string) => {
        if (!data) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        let fileName = `${type}_liga_titan.csv`;
        let rows = [];

        if (type === 'clasificacion') {
            rows.push(["Posicion", "Equipo", "PJ", "GF", "GC", "DG", "Puntos"]);
            data.standings?.forEach((t: any, i: number) => {
                rows.push([
                    i + 1, 
                    t.teams?.name || "Desconocido", 
                    t.played, 
                    t.goals_for, 
                    t.goals_against, 
                    t.goals_for - t.goals_against, 
                    t.points
                ]);
            });
        } else {
            // Mapeo para tablas de jugadores (goles, asistencias, etc.)
            const categoryMap: any = {
                goleadores: { list: data.topScorers, label: "Goles", key: "goals" },
                asistentes: { list: data.topAssists, label: "Asistencias", key: "assists" },
                porteros: { list: data.topKeepers, label: "Vallas Invictas", key: "clean_sheets" },
            };

            const config = categoryMap[type];
            if (config) {
                rows.push(["Posicion", "Jugador", "Equipo", config.label]);
                config.list?.forEach((p: any, i: number) => {
                    rows.push([i + 1, p.name, p.teams?.name || "N/A", p[config.key]]);
                });
            }
        }

        if (rows.length === 0) return;

        rows.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-muted-foreground font-medium animate-pulse">Cargando Liga Titán...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Centro de Estadísticas"
                    description="Análisis detallado de equipos y rendimiento individual basado en datos reales."
                />
                <Button variant="outline" size="sm" onClick={() => downloadCSV('clasificacion')}>
                    <Download className="mr-2 h-4 w-4" /> Exportar Global
                </Button>
            </div>
            
            <Tabs defaultValue="standings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[700px] lg:grid-cols-5 mb-8">
                    <TabsTrigger value="standings">Clasificación</TabsTrigger>
                    <TabsTrigger value="scorers">Goles</TabsTrigger>
                    <TabsTrigger value="assists">Asistencias</TabsTrigger>
                    <TabsTrigger value="keepers">Porteros</TabsTrigger>
                    <TabsTrigger value="discipline">Disciplina</TabsTrigger>
                </TabsList>

                {/* TABLA DE POSICIONES */}
                <TabsContent value="standings">
                    <Card className="overflow-hidden border-2">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <span className="font-bold">Clasificación General</span>
                            <Button variant="ghost" size="sm" onClick={() => downloadCSV('clasificacion')}>
                                <Download className="h-4 w-4 mr-2" /> Descargar CSV
                            </Button>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-16 text-center">Pos</TableHead>
                                    <TableHead>Equipo</TableHead>
                                    <TableHead className="text-center">PJ</TableHead>
                                    <TableHead className="text-center">DG</TableHead>
                                    <TableHead className="text-center font-bold text-blue-600">PTS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.standings?.length > 0 ? (
                                    data.standings.map((team: any, i: number) => (
                                        <TableRow key={team.id} className="hover:bg-slate-50/50">
                                            <TableCell className="text-center font-bold">{i + 1}</TableCell>
                                            <TableCell className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-white p-0.5 border flex items-center justify-center">
                                                    <img 
                                                        src={team.teams?.badge_url || '/placeholder-team.png'} 
                                                        alt="" 
                                                        className="h-full w-full object-contain"
                                                        onError={(e) => (e.currentTarget.src = '/placeholder-team.png')} 
                                                    />
                                                </div>
                                                <span className="font-semibold">{team.teams?.name || 'Equipo Desconocido'}</span>
                                            </TableCell>
                                            <TableCell className="text-center">{team.played}</TableCell>
                                            <TableCell className="text-center font-medium">
                                                {team.goals_for - team.goals_against > 0 ? `+${team.goals_for - team.goals_against}` : team.goals_for - team.goals_against}
                                            </TableCell>
                                            <TableCell className="text-center font-black text-blue-600">{team.points}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No hay datos de clasificación disponibles.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* GOLEADORES */}
                <TabsContent value="scorers">
                    <StatTable 
                        title="Pichichi" 
                        icon={<Trophy className="text-yellow-500 w-5 h-5" />}
                        data={data?.topScorers} 
                        statKey="goals" 
                        statLabel="Goles" 
                        colorClass="text-orange-600"
                        onDownload={() => downloadCSV('goleadores')}
                    />
                </TabsContent>

                {/* ASISTENTES */}
                <TabsContent value="assists">
                    <StatTable 
                        title="Líderes en Asistencias" 
                        icon={<Star className="text-blue-500 w-5 h-5" />}
                        data={data?.topAssists} 
                        statKey="assists" 
                        statLabel="Asistencias" 
                        colorClass="text-blue-600"
                        onDownload={() => downloadCSV('asistentes')}
                    />
                </TabsContent>

                {/* PORTEROS */}
                <TabsContent value="keepers">
                    <StatTable 
                        title="Guante de Oro" 
                        icon={<ShieldAlert className="text-emerald-500 w-5 h-5" />}
                        data={data?.topKeepers} 
                        statKey="clean_sheets" 
                        statLabel="Vallas Invictas" 
                        colorClass="text-emerald-600"
                        onDownload={() => downloadCSV('porteros')}
                    />
                </TabsContent>

                {/* DISCIPLINA */}
                <TabsContent value="discipline">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-0 overflow-hidden border-2">
                            <div className="p-4 bg-yellow-50 border-b flex items-center gap-2 font-bold text-yellow-800">
                                <Ban className="text-yellow-600 w-5 h-5" /> Tarjetas Amarillas
                            </div>
                            <SimpleDisciplineTable data={data?.yellowCards} type="yellow" />
                        </Card>
                        <Card className="p-0 overflow-hidden border-2">
                            <div className="p-4 bg-red-50 border-b flex items-center gap-2 font-bold text-red-800">
                                <Ban className="text-red-600 w-5 h-5" /> Tarjetas Rojas
                            </div>
                            <SimpleDisciplineTable data={data?.redCards} type="red" />
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatTable({ title, icon, data, statKey, statLabel, colorClass, onDownload }: any) {
    return (
        <Card className="overflow-hidden border-2">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                    {icon} {title}
                </div>
                <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 text-center">#</TableHead>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className={`text-center font-bold ${colorClass}`}>{statLabel}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.length > 0 ? (
                        data.map((p: any, i: number) => (
                            <TableRow key={p.id}>
                                <TableCell className="text-center font-medium">{i + 1}</TableCell>
                                <TableCell>
                                    <div className="font-bold">{p.name}</div>
                                    <Badge variant="secondary" className="text-[10px] uppercase">{p.position}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <img 
                                            src={p.teams?.badge_url || '/placeholder-team.png'} 
                                            className="w-4 h-4 object-contain"
                                            onError={(e) => (e.currentTarget.src = '/placeholder-team.png')}
                                            alt=""
                                        />
                                        {p.teams?.name || "N/A"}
                                    </div>
                                </TableCell>
                                <TableCell className={`text-center font-bold text-lg ${colorClass}`}>{p[statKey] || 0}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                No hay datos registrados en esta categoría.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

function SimpleDisciplineTable({ data, type }: any) {
    return (
        <Table>
            <TableBody>
                {data?.length > 0 ? (
                    data.map((p: any) => (
                        <TableRow key={p.id}>
                            <TableCell className="py-3 font-medium pl-4">{p.name}</TableCell>
                            <TableCell className="py-3 text-right pr-4">
                                <Badge className={type === 'yellow' ? "bg-yellow-500 hover:bg-yellow-600 text-black border-none" : "bg-red-600 hover:bg-red-700 text-white border-none"}>
                                    {type === 'yellow' ? (p.yellow_cards || 0) : (p.red_cards || 0)}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell className="h-24 text-center text-muted-foreground italic">
                            Limpio de tarjetas.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}