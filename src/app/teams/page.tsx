"use client";
import React, { useContext, useState } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, Globe, Users, Settings2 } from "lucide-react";
import { TeamSearchDialog } from '@/components/teams/team-search-dialog';
import { TeamFormDialog } from '@/components/teams/team-form-dialog';
import { RosterManagementDialog } from '@/components/teams/roster-management-dialog';
import { Team } from '@/lib/types';

export default function TeamsPage() {
  const { teams, deleteTeam, isLoaded, divisions, updateTeam, addTeam } = useContext(LeagueContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  if (!isLoaded) return <div className="p-10 text-center animate-pulse font-black">Sincronizando...</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Equipos" description="Gestiona clubes y sus jugadores (Límite 20).">
        <div className="flex gap-2">
          <Button onClick={() => setIsSearchOpen(true)} variant="secondary" className="gap-2">
            <Search className="h-4 w-4" /> Buscar en DB
          </Button>
          <Button onClick={() => { setSelectedTeam(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Crear Manual
          </Button>
        </div>
      </PageHeader>

      {teams.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl">
          <p className="text-muted-foreground">La liga está vacía. Importa equipos para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="flex flex-col border-2 overflow-hidden hover:border-blue-500/50 transition-all">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="relative h-12 w-12 shrink-0">
                  {/* Corregido: Prioridad a badge_url para ver las imágenes */}
                  <Image src={team.badge_url || team.logo || "/placeholder-team.png"} alt={team.name} fill className="object-contain" />
                </div>
                <CardTitle className="text-base truncate">{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 mb-4">
                  <Globe className="h-3 w-3" /> {team.country}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between"
                  onClick={() => { setSelectedTeam(team); setIsRosterOpen(true); }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{team.roster.length}/20 Jugadores</span>
                  </div>
                  <Plus className="h-3 w-3" />
                </Button>
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setSelectedTeam(team); setIsFormOpen(true); }}>
                  <Settings2 className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TeamSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <TeamFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} team={selectedTeam} divisions={divisions} onSave={selectedTeam ? updateTeam : addTeam} />
      {selectedTeam && (
        <RosterManagementDialog teamId={selectedTeam.id} isOpen={isRosterOpen} onOpenChange={setIsRosterOpen} />
      )}
    </div>
  );
}