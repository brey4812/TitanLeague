"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

// Componente para listar los equipos clasificados
const TournamentList = ({ title, teams, icon: Icon }: { title: string, teams: any[], icon: any }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Icon className="h-6 w-6 text-yellow-500" />
        </CardHeader>
        <CardContent>
            {teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {teams.map((entry: any) => (
                        <div key={entry.id} className="flex items-center p-3 border rounded-lg bg-muted/20">
                            <img 
                                src={entry.teams.badge_url || "/placeholder-team.png"} 
                                alt={entry.teams.name} 
                                className="w-8 h-8 object-contain mr-3" 
                            />
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate">{entry.teams.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{entry.entry_reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                    <Icons.Trophy className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Temporada 1 en curso</p>
                    <p>Los clasificados a {title} se definirán al finalizar la liga actual.</p>
                </div>
            )}
        </CardContent>
    </Card>
);

export default function TournamentsPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/tournaments/entries?seasonId=2")
            .then(res => res.json())
            .then(json => {
                if (json.ok) setEntries(json.data);
                setLoading(false);
            });
    }, []);

    // Filtros por nombre de competición (ajusta según tus nombres en la DB)
    const champions = entries.filter(e => e.competitions.name.includes("Peak"));
    const cup = entries.filter(e => e.competitions.name.includes("Chalice"));
    const europa = entries.filter(e => e.competitions.name.includes("Shield"));

    if (loading) return <div className="p-10 text-center font-bold">Cargando Torneos Titán...</div>;

    return (
        <div className="container mx-auto py-6">
            <PageHeader
                title="Torneos"
                description="Sigue las fases eliminatorias de la Titan Champions, la Copa y la Supercopa."
            />
            <Tabs defaultValue="champions" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="champions">The Titan Peak</TabsTrigger>
                    <TabsTrigger value="europa">Colossus Shield</TabsTrigger>
                    <TabsTrigger value="copa">Copa</TabsTrigger>
                    <TabsTrigger value="supercopa">Supercopa</TabsTrigger>
                </TabsList>

                <TabsContent value="champions" className="mt-6">
                    <TournamentList title="The Titan Peak (Champions)" teams={champions} icon={Icons.Trophy} />
                </TabsContent>

                <TabsContent value="europa" className="mt-6">
                    <TournamentList title="Colossus Shield (Europa League)" teams={europa} icon={Icons.Trophy} />
                </TabsContent>

                <TabsContent value="copa" className="mt-6">
                    <TournamentList title="Titan's Chalice (Copa)" teams={cup} icon={Icons.Trophy} />
                </TabsContent>

                <TabsContent value="supercopa" className="mt-6">
                    <div className="bg-slate-900 text-white p-10 rounded-xl text-center border-4 border-yellow-500">
                        <Icons.Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-2xl font-black italic uppercase">Eternal Glory Cup</h2>
                        <p className="mt-2 text-slate-400">Sólo para los 4 campeones de división. Se jugará al inicio de la T2.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}