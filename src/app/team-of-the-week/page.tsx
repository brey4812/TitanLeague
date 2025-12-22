"use client";
import { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { TeamOfTheWeekView } from "@/components/team-of-the-week/team-of-the-week-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamOfTheWeekPage() {
  const [period, setPeriod] = useState("week");

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Los 11 de la Liga Titán"
        description="El reconocimiento a los mejores rendimientos individuales."
      />

      <Tabs defaultValue="week" onValueChange={setPeriod} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
          <TabsTrigger value="week">11 de la Jornada</TabsTrigger>
          <TabsTrigger value="month">11 del Mes</TabsTrigger>
          <TabsTrigger value="season">11 de la Temporada</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-6">
          <TeamOfTheWeekView type="week" />
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          <TeamOfTheWeekView type="month" />
        </TabsContent>

        <TabsContent value="season" className="mt-6">
          <TeamOfTheWeekView type="season" />
        </TabsContent>
      </Tabs>
    </div>
  );
}