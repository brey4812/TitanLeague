"use client";

import { useState } from "react";
import Image from "next/image";
import type { Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface H2hViewProps {
  teams: Team[];
}

export function H2hView({ teams }: H2hViewProps) {
  const [team1Id, setTeam1Id] = useState<string | null>(null);
  const [team2Id, setTeam2Id] = useState<string | null>(null);
  const [result, setResult] = useState<{ wins: number, draws: number, losses: number } | null>(null);

  const handleShowH2h = () => {
    if (team1Id && team2Id) {
      // Mocked result
      setResult({
        wins: Math.floor(Math.random() * 10),
        draws: Math.floor(Math.random() * 5),
        losses: Math.floor(Math.random() * 10),
      });
    }
  };

  const team1 = team1Id ? teams.find(t => t.id === parseInt(team1Id)) : null;
  const team2 = team2Id ? teams.find(t => t.id === parseInt(team2Id)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Teams</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <Select onValueChange={setTeam1Id}>
            <SelectTrigger>
              <SelectValue placeholder="Select Team 1" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={String(team.id)} disabled={team.id === (team2Id ? parseInt(team2Id) : -1)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-center font-bold text-muted-foreground">vs</span>
          <Select onValueChange={setTeam2Id}>
            <SelectTrigger>
              <SelectValue placeholder="Select Team 2" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={String(team.id)} disabled={team.id === (team1Id ? parseInt(team1Id) : -1)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-center mt-6">
          <Button onClick={handleShowH2h} disabled={!team1Id || !team2Id}>
            Show Head-to-Head
          </Button>
        </div>
        {result && team1 && team2 && (
          <div className="mt-8">
            <h3 className="text-center text-2xl font-bold mb-6 font-headline">Historical H2H</h3>
            <div className="flex justify-around items-center text-center">
              <div className="flex flex-col items-center gap-2">
                <Image src={team1.logoUrl} alt={team1.name} width={80} height={80} className="rounded-full" data-ai-hint={team1.dataAiHint} />
                <p className="font-bold text-lg">{team1.name}</p>
              </div>
              <div className="flex items-center gap-4 text-2xl font-bold">
                <span className="text-primary">{result.wins}</span>
                <span>-</span>
                <span className="text-muted-foreground">{result.draws}</span>
                <span>-</span>
                <span className="text-destructive">{result.losses}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Image src={team2.logoUrl} alt={team2.name} width={80} height={80} className="rounded-full" data-ai-hint={team2.dataAiHint}/>
                <p className="font-bold text-lg">{team2.name}</p>
              </div>
            </div>
             <p className="text-center text-xs text-muted-foreground mt-2">W - D - L</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
