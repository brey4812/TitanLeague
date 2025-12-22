"use client";
import React, { useContext, useState } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamFormDialog } from '@/components/teams/team-form-dialog';
import { LeagueContext } from '@/context/league-context';
import { Team } from '@/lib/types';
import { Trash2, Settings2, Plus, Users } from "lucide-react";

export default function TeamsPage() {
  const { teams, divisions, updateTeam, addTeam, deleteTeam, isLoaded } = useContext(LeagueContext);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isLoaded) return <div className="p-10 text-center font-bold animate-pulse">Cargando base de datos...</div>;

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Equipos"
        description="Gestiona los clubes participantes. Borra equipos o añade nuevos buscando en la base de datos."
      >
        <Button onClick={() => { setSelectedTeam(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Añadir Nuevo Equipo
        </Button>
      </PageHeader>

      {teams.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No hay equipos en la liga. ¡Añade el primero!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {teams.sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
            <Card key={team.id} className="flex flex-col group border-2 hover:border-primary/50 transition-all">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="relative h-12 w-12 rounded-lg bg-muted p-1 border">
                  <Image
                    src={team.logoUrl || '/placeholder-team.png'}
                    alt={team.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <CardTitle className="text-lg truncate">{team.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <Badge variant="outline" className="mb-4">{team.divisionName}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{team.roster.length} Jugadores</span>
                </div>
              </CardContent>

              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeam(team); setIsFormOpen(true); }}>
                  <Settings2 className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => { if(confirm(`¿Borrar ${team.name}?`)) deleteTeam(team.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TeamFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={(data) => {
          selectedTeam ? updateTeam(data) : addTeam(data);
          setIsFormOpen(false);
        }}
        team={selectedTeam}
        divisions={divisions}
      />
    </div>
  );
}