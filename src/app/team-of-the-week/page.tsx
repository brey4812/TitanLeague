import { PageHeader } from "@/components/shared/page-header";
import { TeamOfTheWeekView } from "@/components/team-of-the-week/team-of-the-week-view";
import { matchResults } from "@/lib/data";

export default function TeamOfTheWeekPage() {
  const latestWeek = matchResults.reduce((max, m) => Math.max(max, m.week), 0);

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
