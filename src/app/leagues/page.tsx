"use client";

import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTableClient } from "@/components/leagues/league-table-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy, Download } from "lucide-react"; // Importamos Download
import { Division } from "@/lib/types";
import { Button } from "@/components/ui/button"; // Importamos Button

export default function LeaguesPage() {
  const { divisions, teams, isLoaded } = useContext(LeagueContext);

  // FUNCIÓN DE DESCARGA REINTEGRADA
  const downloadDivisionCSV = (divisionName: string, divisionTeams: any[]) => {
    if (!divisionTeams.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    let fileName = `clasificacion_${divisionName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    
    // Encabezados (Ajustados a los campos de tu contexto)
    const headers = ["Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Puntos"];
    csvContent += headers.join(",") + "\r\n";

    // Filas: Usamos los nombres de propiedades que vienen de tu LeagueContext/Standings
    divisionTeams.forEach((t) => {
      const row = [
        t.name,
        t.played || 0,
        t.won || 0,
        t.drawn || 0,
        t.lost || 0,
        t.gf || 0,
        t.ga || 0,
        (t.gf || 0) - (t.ga || 0),
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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Clasificación"
          description="Consulta los puntos y el rendimiento de los clubes por división."
        />
        {/* Botón de descarga global (opcional) */}
        {teams.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => downloadDivisionCSV("General", teams)}>
                <Download className="h-4 w-4 mr-2" /> Exportar Todo
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-slate-100 p-1 border">
            {divisions.map((div: Division) => (
              <TabsTrigger 
                key={div.id} 
                value={div.id.toString()} 
                className="font-bold py-2"
              >
                {div.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {divisions.map((div: Division) => {
            const teamsInDivision = teams.filter(t => t.division_id === div.id);

            return (
              <TabsContent key={div.id} value={div.id.toString()} className="mt-6 space-y-4">
                {teamsInDivision.length > 0 ? (
                  <>
                    <div className="flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-muted-foreground hover:text-blue-600"
                            onClick={() => downloadDivisionCSV(div.name, teamsInDivision)}
                        >
                            <Download className="h-3 w-3 mr-2" /> Descargar {div.name} (.csv)
                        </Button>
                    </div>
                    <LeagueTableClient division={div} teams={teamsInDivision} />
                  </>
                ) : (
                  <div className="py-20 text-center bg-white italic text-muted-foreground border rounded-xl">
                    No hay equipos en esta división aún.
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