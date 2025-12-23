"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trophy, Star, ShieldAlert, Ban } from "lucide-react";

export default function StatsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Asumimos que tu API ahora devuelve todas estas categorías
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

    const downloadCSV = (type: string) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        let fileName = `${type}_liga_titan.csv`;
        
        // Lógica de exportación genérica basada en la data
        // ... (puedes expandir la lógica anterior para incluir las nuevas columnas)
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Cargando Liga Titán...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Centro de Estadísticas"
                    description="Análisis detallado de equipos y rendimiento individual."
                />
            </div>
            
            <Tabs defaultValue="standings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-5 mb-8">
                    <TabsTrigger value="standings">Clasificación</TabsTrigger>
                    <TabsTrigger value="scorers">Goles</TabsTrigger>
                    <TabsTrigger value="assists">Asistencias</TabsTrigger>
                    <TabsTrigger value="keepers">Porteros</TabsTrigger>
                    <TabsTrigger value="discipline">Disciplina</TabsTrigger>
                </TabsList>

                {/* TABLA DE POSICIONES */}
                <TabsContent value="standings">
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-12 text-center">Pos</TableHead>
                                    <TableHead>Equipo</TableHead>
                                    <TableHead className="text-center">PJ</TableHead>
                                    <TableHead className="text-center">DG</TableHead>
                                    <TableHead className="text-center font-bold text-primary">PTS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.standings.map((team: any, i: number) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="text-center font-bold">{i + 1}</TableCell>
                                        <TableCell className="flex items-center gap-3">
                                            <img src={team.teams.badge_url} alt="logo" className="w-8 h-8 object-contain" />
                                            <span className="font-semibold">{team.teams.name}</span>
                                        </TableCell>
                                        <TableCell className="text-center">{team.played}</TableCell>
                                        <TableCell className="text-center">{team.goals_for - team.goals_against}</TableCell>
                                        <TableCell className="text-center font-black text-primary">{team.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* GOLEADORES */}
                <TabsContent value="scorers">
                    <StatTable 
                        title="Máximos Goleadores" 
                        icon={<Trophy className="text-yellow-500 w-5 h-5" />}
                        data={data?.topScorers} 
                        statKey="goals" 
                        statLabel="Goles" 
                        colorClass="text-orange-600"
                    />
                </TabsContent>

                {/* ASISTENTES */}
                <TabsContent value="assists">
                    <StatTable 
                        title="Máximos Asistentes" 
                        icon={<Star className="text-blue-500 w-5 h-5" />}
                        data={data?.topAssists} 
                        statKey="assists" 
                        statLabel="Asistencias" 
                        colorClass="text-blue-600"
                    />
                </TabsContent>

                {/* PORTEROS (Clean Sheets) */}
                <TabsContent value="keepers">
                    <StatTable 
                        title="Guantes de Oro" 
                        icon={<ShieldAlert className="text-emerald-500 w-5 h-5" />}
                        data={data?.topKeepers} 
                        statKey="clean_sheets" 
                        statLabel="Vallas Invictas" 
                        colorClass="text-emerald-600"
                    />
                </TabsContent>

                {/* DISCIPLINA (Tarjetas) */}
                <TabsContent value="discipline">
                    <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2"><Ban className="text-yellow-500" /> Tarjetas Amarillas</h3>
                            <SimpleDisciplineTable data={data?.yellowCards} type="yellow" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2"><Ban className="text-red-500" /> Tarjetas Rojas</h3>
                            <SimpleDisciplineTable data={data?.redCards} type="red" />
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Sub-componente para tablas de estadísticas individuales
function StatTable({ title, icon, data, statKey, statLabel, colorClass }: any) {
    return (
        <Card>
            <div className="p-4 border-b flex items-center gap-2 font-bold text-lg">
                {icon} {title}
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className={`text-center font-bold ${colorClass}`}>{statLabel}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.map((p: any, i: number) => (
                        <TableRow key={p.id}>
                            <TableCell className="text-center font-medium">{i + 1}</TableCell>
                            <TableCell>
                                <div className="font-bold">{p.name}</div>
                                <Badge variant="secondary" className="text-[10px]">{p.position}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{p.teams?.name}</TableCell>
                            <TableCell className={`text-center font-bold text-lg ${colorClass}`}>{p[statKey]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

// Sub-componente para tablas de disciplina rápidas
function SimpleDisciplineTable({ data, type }: any) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableBody>
                    {data?.map((p: any) => (
                        <TableRow key={p.id}>
                            <TableCell className="py-2 font-medium">{p.name}</TableCell>
                            <TableCell className="py-2 text-right">
                                <Badge className={type === 'yellow' ? "bg-yellow-400" : "bg-red-500"}>
                                    {type === 'yellow' ? p.yellow_cards : p.red_cards}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}