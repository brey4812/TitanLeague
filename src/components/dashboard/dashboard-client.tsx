"use client";

import { useState } from "react";
import Image from "next/image";
import type { MatchResult, Team } from "@/lib/types";
import { getTeamById } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { generatePressNotes } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardClientProps {
  recentMatches: MatchResult[];
}

export function DashboardClient({ recentMatches }: DashboardClientProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [pressNotes, setPressNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShowPressNotes = async (match: MatchResult) => {
    setSelectedMatch(match);
    setIsLoading(true);
    setPressNotes(null);

    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);

    if (!homeTeam || !awayTeam) {
        toast({ title: "Error", description: "Team data not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const input = {
      team1Name: homeTeam.name,
      team1Logo: homeTeam.logoUrl,
      team1Wins: homeTeam.stats.wins,
      team1Draws: homeTeam.stats.draws,
      team1Losses: homeTeam.stats.losses,
      team1GoalsFor: homeTeam.stats.goalsFor,
      team1GoalsAgainst: homeTeam.stats.goalsAgainst,
      team2Name: awayTeam.name,
      team2Logo: awayTeam.logoUrl,
      team2Wins: awayTeam.stats.wins,
      team2Draws: awayTeam.stats.draws,
      team2Losses: awayTeam.stats.losses,
      team2GoalsFor: awayTeam.stats.goalsFor,
      team2GoalsAgainst: awayTeam.stats.goalsAgainst,
      matchType: "Derby" as const,
    };

    const result = await generatePressNotes(input);

    if (result.success && result.data) {
      setPressNotes(result.data.pressNotes);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const MatchCard = ({ match }: { match: MatchResult }) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);

    if (!homeTeam || !awayTeam) return null;

    return (
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4 flex-1">
          <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={40} height={40} className="rounded-full" data-ai-hint={homeTeam.dataAiHint} />
          <span className="font-medium text-right w-24 sm:w-32 truncate">{homeTeam.name}</span>
        </div>
        <div className="text-center font-bold text-lg mx-4">
          <span>{match.homeScore} - {match.awayScore}</span>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <span className="font-medium text-left w-24 sm:w-32 truncate">{awayTeam.name}</span>
          <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={40} height={40} className="rounded-full" data-ai-hint={awayTeam.dataAiHint} />
        </div>
        {match.isImportant && (
          <Button variant="ghost" size="icon" className="ml-4" onClick={() => handleShowPressNotes(match)}>
            <Icons.Press className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  };
  
  const PressNoteContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 mt-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if(pressNotes) {
        return <div className="prose prose-sm dark:prose-invert mt-4" dangerouslySetInnerHTML={{ __html: pressNotes.replace(/\n/g, '<br />') }} />;
    }
    return null;
  }
  
  const homeTeam = selectedMatch ? getTeamById(selectedMatch.homeTeamId) : null;
  const awayTeam = selectedMatch ? getTeamById(selectedMatch.awayTeamId) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMatch} onOpenChange={(isOpen) => !isOpen && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            {homeTeam && awayTeam && (
                <DialogTitle className="text-center text-2xl font-headline">
                    <div className="flex justify-around items-center">
                        <div className="flex flex-col items-center gap-2">
                            <Image src={homeTeam.logoUrl} alt={homeTeam.name} width={60} height={60} className="rounded-full" data-ai-hint={homeTeam.dataAiHint}/>
                            <span>{homeTeam.name}</span>
                        </div>
                        <span className="text-4xl font-black text-primary">VS</span>
                         <div className="flex flex-col items-center gap-2">
                            <Image src={awayTeam.logoUrl} alt={awayTeam.name} width={60} height={60} className="rounded-full" data-ai-hint={awayTeam.dataAiHint}/>
                            <span>{awayTeam.name}</span>
                        </div>
                    </div>
                </DialogTitle>
            )}
          </DialogHeader>
          <PressNoteContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
