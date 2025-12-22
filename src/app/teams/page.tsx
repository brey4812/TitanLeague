"use client";

import React, { useContext, useState } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Search, Plus, Trash2, Globe, Shield } from "lucide-react";
// Importación corregida a la ruta que mencionas
import { TeamSearchDialog } from '@/components/teams/team-search-dialog';

export default function TeamsPage() {
  const { teams, deleteTeam, isLoaded } = useContext(LeagueContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold animate-pulse text-muted-foreground">
        Sincronizando con la Base de Datos...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Gestión de Clubes"
        description="Panel administrativo para importar y gestionar equipos desde la base de datos global de Supabase."
      >
        <Button onClick={() => setIsSearchOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Search className="h-4 w-4" /> Buscar Equipo Global
        </Button>
      </PageHeader>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-3xl bg-muted/10 border-muted-foreground/20">
          <div className="bg-muted p-6 rounded-full mb-6">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Tu liga está vacía</h3>
          <p className="text-muted-foreground mb-8 text-center max-w-sm">
            Busca equipos reales en la base de datos para añadirlos a tu liga personalizada.
          </p>
          <Button onClick={() => setIsSearchOpen(true)} size="lg" className="px-8">
            Buscar mi primer equipo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden border-2 transition-all hover:shadow-xl group">
              <CardHeader className="flex-row items-center gap-4 bg-muted/20 pb-4">
                <div className="relative h-14 w-14 rounded-xl bg-white p-1.5 shadow-md border border-slate-200 text-center flex items-center justify-center">
                  <Image 
                    src={team.badge_url || '/placeholder-team.png'} 
                    alt={team.name} 
                    fill 
                    className="object-contain p-1" 
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-lg font-bold truncate">{team.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" /> {team.country}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <p className="text-[10px] font-bold text-red-600 uppercase">ATQ</p>
                    <p className="text-lg font-black text-red-700">{team.attack}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">MED</p>
                    <p className="text-lg font-black text-blue-700">{team.midfield}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-[10px] font-bold text-green-600 uppercase">DEF</p>
                    <p className="text-lg font-black text-green-700">{team.defense}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase">OVR</p>
                    <p className="text-lg font-black text-yellow-700">{team.overall}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 font-medium">
                  <Shield className="h-4 w-4" />
                  <span className="truncate">{team.league}</span>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/5 p-4 border-t">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full gap-2 opacity-90 group-hover:opacity-100 transition-opacity" 
                  onClick={() => {
                    if(confirm(`¿Deseas eliminar al ${team.name} de la liga?`)) deleteTeam(team.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar Inscripción
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TeamSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}