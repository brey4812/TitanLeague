"use client";

import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTableClient } from "@/components/leagues/league-table-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy, Download, Calendar } from "lucide-react";
import { Division, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LeaguesPage() {
  // Extraemos season para mostrar en qué temporada estamos
  const { divisions, teams, isLoaded, season } = useContext(LeagueContext);

  // FUNCIÓN DE DESCARGA OPTIMIZADA
  const downloadDivisionCSV = (divisionName: string, divisionTeams: Team[]) => {
    if (!divisionTeams.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    let fileName = `clasificacion_T${season}_${divisionName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    
    // Encabezados sincronizados con processedTeams del contexto
    const headers = ["Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Puntos"];
    csvContent += headers.join(",") + "\r\n";

    divisionTeams.forEach((t) => {
      const row = [
        t.name,
        t.stats?.wins! + t.stats?.draws! + t.stats?.losses! || 0, // Partidos Jugados
        t.stats?.wins || 0,
        t.stats?.draws || 0,
        t.stats?.losses || 0,
        t.stats?.goalsFor || 0,
        t.stats?.goalsAgainst || 0,
        (t.stats?.goalsFor || 0) - (t.stats?.goalsAgainst || 0),
        t.points || 0
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground italic">
        Calculando clasificaciones de la Liga Titán...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <PageHeader
              title="Clasificación"
              description="Consulta los puntos y el rendimiento de los clubes por división."
            />
            {/* Badge de Temporada para claridad visual */}
            <Badge variant="secondary" className="h-fit py-1 px-3 flex gap-2 border-blue-200 bg-blue-50 text-blue-700">
              <Calendar className="h-3 w-3" /> Temporada {season}
            </Badge>
          </div>
        </div>

        {teams.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => downloadDivisionCSV("General", teams)}>
            <Download className="h-4 w-4 mr-2" /> Exportar Todo (.csv)
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold">Sin equipos inscritos</h3>
          <p className="text-muted-foreground">Importa equipos desde la sección de gestión para ver las tablas.</p>
        </div>
      ) : (
        <Tabs defaultValue={divisions[0]?.id.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-slate-100 p-1 border shadow-sm rounded-lg">
            {divisions.map((div: Division) => (
              <TabsTrigger 
                key={div.id} 
                value={div.id.toString()} 
                className="font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                {div.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {divisions.map((div: Division) => {
            // Filtrado dinámico por división
            const teamsInDivision = teams
              .filter(t => t.division_id === div.id)
              .sort((a, b) => (b.points || 0) - (a.points || 0)); // Aseguramos orden descendente por puntos

            return (
              <TabsContent key={div.id} value={div.id.toString()} className="mt-6 space-y-4 focus-visible:outline-none">
                {teamsInDivision.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm">
                      <p className="text-sm font-medium text-muted-foreground">
                        Mostrando <span className="font-bold text-foreground">{teamsInDivision.length}</span> equipos en competencia.
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={() => downloadDivisionCSV(div.name, teamsInDivision)}
                      >
                        <Download className="h-3.5 w-3.5 mr-2" /> Descargar {div.name}
                      </Button>
                    </div>
                    {/* El componente LeagueTableClient recibe los equipos ya procesados con sus puntos */}
                    <LeagueTableClient division={div} teams={teamsInDivision} />
                  </>
                ) : (
                  <div className="py-20 text-center bg-white italic text-muted-foreground border border-dashed rounded-xl">
                    No hay equipos compitiendo en esta división para la Temporada {season}.
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}