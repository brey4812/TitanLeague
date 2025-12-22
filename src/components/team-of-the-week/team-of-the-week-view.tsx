"use client"

import { useState, useEffect, useRef, useContext } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { TeamOfTheWeekPlayer } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { FootballField } from "./football-field";
import { LeagueContext } from "@/context/league-context";

interface ViewProps { type: "week" | "month" | "season"; }

export function TeamOfTheWeekView({ type }: ViewProps) {
    const { getBestEleven, matches } = useContext(LeagueContext);
    const [week, setWeek] = useState(1);
    const [team, setTeam] = useState<TeamOfTheWeekPlayer[]>([]);
    const fieldRef = useRef<HTMLDivElement>(null);

    const maxWeek = matches.reduce((max, m) => Math.max(max, m.week), 0);

    useEffect(() => {
        setTeam(getBestEleven(type, week));
    }, [week, type, getBestEleven]);

    const handleDownload = async () => {
        if (!fieldRef.current) return;
        const canvas = await html2canvas(fieldRef.current, { scale: 2, backgroundColor: '#15803d' });
        const link = document.createElement('a');
        link.download = `11-${type}-${week}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const formation = {
        goalkeeper: team.filter(p => p.position === 'Goalkeeper').slice(0, 1),
        defenders: team.filter(p => p.position === 'Defender').slice(0, 4),
        midfielders: team.filter(p => p.position === 'Midfielder').slice(0, 3),
        forwards: team.filter(p => p.position === 'Forward').slice(0, 3),
    };

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/50">
                {type === "week" && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setWeek(w => Math.max(1, w-1))} disabled={week <= 1}>
                            <Icons.ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-bold">Jornada {week}</span>
                        <Button variant="outline" size="icon" onClick={() => setWeek(w => Math.min(maxWeek, w+1))} disabled={week >= maxWeek}>
                            <Icons.ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <Button onClick={handleDownload} className="ml-auto">
                    <Icons.Download className="mr-2 h-4 w-4" /> Descargar
                </Button>
            </div>
            <div className="bg-green-900 p-4 md:p-10" ref={fieldRef}>
                <FootballField formation={formation} />
            </div>
        </Card>
    );
}