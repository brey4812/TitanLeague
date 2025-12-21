"use client";
import { useContext } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { H2hView } from "@/components/h2h/h2h-view";
import { LeagueContext } from '@/context/league-context';

export default function H2hPage() {
    const { teams } = useContext(LeagueContext);
    
    if (!teams.length) {
      return <div>Cargando...</div>;
    }

  return (
    <>
      <PageHeader
        title="Cara a Cara (H2H)"
        description="Compara el historial de enfrentamientos entre dos equipos de la liga."
      />
      <H2hView teams={teams} />
    </>
  );
}
