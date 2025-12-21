
"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { getTeamOfTheWeek } from "@/lib/data";
import { TeamOfTheWeekPlayer } from "@/lib/types";
import { Badge } from "../ui/badge";

interface TeamOfTheWeekProps {
    initialWeek: number;
}

export function TeamOfTheWeek({ initialWeek }: TeamOfTheWeekProps) {
    const [week, setWeek] = useState(initialWeek);
    const [team, setTeam] = useState<TeamOfTheWeekPlayer[]>([]);

    useEffect(() => {
        setTeam(getTeamOfTheWeek(week));
    }, [week]);
    
    useEffect(() => {
        setWeek(initialWeek);
    }, [initialWeek]);

    const handlePrevWeek = () => {
        setWeek(w => Math.max(1, w - 1));
    };

    const handleNextWeek = () => {
        setWeek(w => w + 1);
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>11 de la Jornada</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek} disabled={week <= 1}>
                        <Icons.ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-20 text-center">Jornada {week}</span>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}>
                        <Icons.ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {team.map(player => (
                        <div key={player.id} className="flex items-center gap-4">
                             <Image
                                src={player.teamLogoUrl}
                                alt={player.teamName}
                                width={24}
                                height={24}
                                className="rounded-full"
                                data-ai-hint={player.teamDataAiHint}
                            />
                            <div className="flex-1">
                                <p className="font-medium">{player.name}</p>
                                <p className="text-xs text-muted-foreground">{player.teamName}</p>
                            </div>
                            <Badge variant="secondary">{player.position}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
