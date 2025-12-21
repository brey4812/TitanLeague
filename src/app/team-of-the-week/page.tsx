"use client";
import { useContext } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { TeamOfTheWeekView } from "@/components/team-of-the-week/team-of-the-week-view";
import { LeagueContext } from "@/context/league-context";

export default function TeamOfTheWeekPage() {
  const { matches } = useContext(LeagueContext);
  
  if (!matches.length) {
    return <div>Cargando...</div>
  }

  const latestWeek = matches.reduce((max, m) => Math.max(max, m.week), 0);

  return (
    <>
      <PageHeader
        title="11 de la Jornada"
        description="El equipo ideal de la semana, seleccionando a los mejores jugadores."
      />
      <TeamOfTheWeekView initialWeek={latestWeek} />
    </>
  );
}
