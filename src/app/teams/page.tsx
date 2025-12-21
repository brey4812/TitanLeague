"use client";
import React from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { getAllTeams, divisions } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamFormDialog } from '@/components/teams/team-form-dialog';
import { Team } from '@/lib/types';


export default function TeamsPage() {
  const [teams, setTeams] = React.useState(getAllTeams());
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleManageTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleFormSave = (teamData: Team) => {
    if (selectedTeam) {
      // It's an existing team, so we update it
      setTeams(currentTeams => currentTeams.map(t => t.id === teamData.id ? teamData : t));
    } else {
      // It's a new team, we add it
      const newTeamWithId = { ...teamData, id: Math.max(0, ...teams.map(t => t.id)) + 1 };
      setTeams(currentTeams => [...currentTeams, newTeamWithId]);
    }
    setIsFormOpen(false);
    setSelectedTeam(null);
  };

  return (
    <>
      <PageHeader
        title="Equipos"
        description="Navega y gestiona todos los equipos de todas las divisiones."
      >
        <Button onClick={handleAddTeam}>Añadir Nuevo Equipo</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teams.sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
          <Card key={team.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <Image
                    src={team.logoUrl}
                    alt={`${team.name} logo`}
                    width={48}
                    height={48}
                    className="rounded-full bg-muted object-cover"
                    data-ai-hint={team.dataAiHint}
                />
                <CardTitle className="font-headline text-lg">{team.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <Badge variant="secondary">{team.divisionName}</Badge>
                <div className="text-sm text-muted-foreground mt-4 space-y-1">
                    <p>Victorias: {team.stats.wins}</p>
                    <p>Empates: {team.stats.draws}</p>
                    <p>Derrotas: {team.stats.losses}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleManageTeam(team)}>
                  Gestionar Equipo
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <TeamFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleFormSave}
        team={selectedTeam}
        divisions={divisions.map(({ id, name }) => ({ id, name }))}
      />
    </>
  );
}
