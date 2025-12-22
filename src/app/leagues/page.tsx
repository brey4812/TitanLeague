"use client";

import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTableClient } from "@/components/leagues/league-table-client";
import { LeagueContext } from "@/context/league-context";
import { Trophy } from "lucide-react";
import { Division } from "@/lib/types";

export default function LeaguesPage() {
  const { divisions, teams, isLoaded } = useContext(LeagueContext);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground italic">
        Calculando clasificaciones de la Liga Titán...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Clasificación"
        description="Consulta los puntos y el rendimiento de los clubes por división."
      />

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
            // Filtramos los equipos que pertenecen a esta división
            const teamsInDivision = teams.filter(t => t.division_id === div.id);

            return (
              <TabsContent key={div.id} value={div.id.toString()} className="mt-6">
                {teamsInDivision.length > 0 ? (
                  // Corregido: Pasamos 'division' y 'teams' por separado
                  <LeagueTableClient division={div} teams={teamsInDivision} />
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