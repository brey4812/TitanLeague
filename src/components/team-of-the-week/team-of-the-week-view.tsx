"use client"

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { getTeamOfTheWeek } from "@/lib/data";
import { TeamOfTheWeekPlayer } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { FootballField } from "./football-field";

interface TeamOfTheWeekViewProps {
    initialWeek: number;
}

export function TeamOfTheWeekView({ initialWeek }: TeamOfTheWeekViewProps) {
    const [week, setWeek] = useState(initialWeek);
    const [team, setTeam] = useState<TeamOfTheWeekPlayer[]>([]);
    const fieldRef = useRef<HTMLDivElement>(null);

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
    
    const handleDownload = async () => {
        if (!fieldRef.current) return;
        const canvas = await html2canvas(fieldRef.current, {
            useCORS: true,
            backgroundColor: '#166534', // a dark green color
        });
        const link = document.createElement('a');
        link.download = `11-de-la-jornada-${week}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };
    
    const goalkeepers = team.filter(p => p.position === 'Goalkeeper');
    const defenders = team.filter(p => p.position === 'Defender');
    const midfielders = team.filter(p => p.position === 'Midfielder');
    const forwards = team.filter(p => p.position === 'Forward');

    // Simple 4-3-3 formation
    const formation = {
        goalkeeper: goalkeepers.slice(0, 1),
        defenders: defenders.slice(0, 4),
        midfielders: midfielders.slice(0, 3),
        forwards: forwards.slice(0, 3),
    };

    return (
        <Card>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek} disabled={week <= 1}>
                        <Icons.ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-24 text-center">Jornada {week}</span>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}>
                        <Icons.ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={handleDownload}>
                    <Icons.Download className="mr-2 h-4 w-4" />
                    Descargar
                </Button>
            </div>
            <div ref={fieldRef} className="p-4 bg-green-700">
                <FootballField formation={formation} />
            </div>
        </Card>
    );
}
