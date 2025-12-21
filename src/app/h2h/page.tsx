import { PageHeader } from "@/components/shared/page-header";
import { getAllTeams } from "@/lib/data";
import { H2hView } from "@/components/h2h/h2h-view";

export default function H2hPage() {
    const teams = getAllTeams();
  return (
    <>
      <PageHeader
        title="Head-to-Head"
        description="Compare the historical record between any two teams in the league."
      />
      <H2hView teams={teams} />
    </>
  );
}
