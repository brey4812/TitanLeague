import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { getAllTeams } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge }a "@/components/ui/badge";

export default function TeamsPage() {
  const teams = getAllTeams();

  return (
    <>
      <PageHeader
        title="Teams"
        description="Browse and manage all teams across all divisions."
      >
        <Button>Add New Team</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <Image
                    src={team.logoUrl}
                    alt={`${team.name} logo`}
                    width={48}
                    height={48}
                    className="rounded-full"
                    data-ai-hint={team.dataAiHint}
                />
                <CardTitle className="font-headline text-lg">{team.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <Badge variant="secondary">{team.divisionName}</Badge>
                <div className="text-sm text-muted-foreground mt-4 space-y-1">
                    <p>Wins: {team.stats.wins}</p>
                    <p>Draws: {team.stats.draws}</p>
                    <p>Losses: {team.stats.losses}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full">Manage Team</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
