"use client";
import { PageHeader } from "@/components/shared/page-header";
import { TeamOfTheWeekView } from "@/components/team-of-the-week/team-of-the-week-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamOfTheWeekPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Los 11 de la Liga Titán"
        description="Reconocimiento a los mejores rendimientos individuales del periodo."
      />

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="week">11 de la Jornada</TabsTrigger>
          <TabsTrigger value="month">11 del Mes</TabsTrigger>
          <TabsTrigger value="season">11 de la Temporada</TabsTrigger>
        </TabsList>

        <div className="mt-8 bg-slate-50 rounded-2xl p-4 md:p-8 border border-dashed border-slate-300">
          <TabsContent value="week">
            <TeamOfTheWeekView type="week" />
          </TabsContent>
          <TabsContent value="month">
            <TeamOfTheWeekView type="month" />
          </TabsContent>
          <TabsContent value="season">
            <TeamOfTheWeekView type="season" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}