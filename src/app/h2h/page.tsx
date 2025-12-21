import { PageHeader } from "@/components/shared/page-header";
import { getAllTeams } from "@/lib/data";
import { H2hView } from "@/components/h2h/h2h-view";

export default function H2hPage() {
    const teams = getAllTeams();
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
