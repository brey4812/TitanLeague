"use client";

import React, { useContext, useState } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, Globe, Users, Settings2 } from "lucide-react";
import { TeamSearchDialog } from '@/components/teams/team-search-dialog';
import { TeamFormDialog } from '@/components/teams/team-form-dialog'; // Diálogo de creación manual
import { Team } from '@/lib/types';

export default function TeamsPage() {
  const { teams, deleteTeam, isLoaded, divisions, updateTeam, addTeam } = useContext(LeagueContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  if (!isLoaded) return <div className="p-10 text-center font-bold animate-pulse">Cargando...</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Equipos" description="Importa clubes de la base de datos o crea tus propios equipos personalizados.">
        <div className="flex gap-2">
          <Button onClick={() => setIsSearchOpen(true)} variant="secondary" className="gap-2">
            <Search className="h-4 w-4" /> Buscar Global
          </Button>
          <Button onClick={() => { setSelectedTeam(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Crear Nuevo Equipo
          </Button>
        </div>
      </PageHeader>

      {teams.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl italic text-muted-foreground">
          No hay equipos en tu liga. Utiliza los botones superiores para empezar.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="flex flex-col border-2 group transition-all hover:border-blue-500/50">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="relative h-12 w-12 rounded bg-muted p-1">
                  <Image src={team.badge_url || '/placeholder-team.png'} alt={team.name} fill className="object-contain" />
                </div>
                <CardTitle className="text-lg truncate">{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 font-bold uppercase italic">
                  <Globe className="h-3.3 w-3.3 text-blue-500" /> {team.country}
                </div>
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded border">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{team.roster?.length || 0} Jugadores</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700">
                    Gestionar
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeam(team); setIsFormOpen(true); }}>
                  <Settings2 className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => { if(confirm("¿Borrar?")) deleteTeam(team.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Buscador de DB */}
      <TeamSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
      
      {/* Creador Manual */}
      <TeamFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        team={selectedTeam} 
        divisions={divisions}
        onSave={(data) => {
          selectedTeam ? updateTeam(data) : addTeam(data);
          setIsFormOpen(false);
        }}
      />
    </div>
  );
}