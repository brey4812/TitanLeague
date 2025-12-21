"use client";
import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTableClient } from "@/components/leagues/league-table-client";
import { LeagueContext } from "@/context/league-context";


export default function LeaguesPage() {
  const { divisions, isLoaded } = useContext(LeagueContext);

  if (!isLoaded || !divisions.length) {
    return <div>Cargando...</div>
  }

  return (
    <>
      <PageHeader
        title="Ligas"
        description="Consulta la clasificación actual de todas las divisiones de la Liga Titán."
      />
      <Tabs defaultValue={divisions[0].name} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          {divisions.map((division) => (
            <TabsTrigger key={division.id} value={division.name}>
              {division.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {divisions.map((division) => (
          <TabsContent key={division.id} value={division.name} className="mt-6">
            <LeagueTableClient division={division} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
