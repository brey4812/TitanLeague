"use client";
import { useContext, useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { LeagueContext } from '@/context/league-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function H2hPage() {
  const { teams, isLoaded } = useContext(LeagueContext);
  const [teamA, setTeamA] = useState<string>("");
  const [teamB, setTeamB] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Cada vez que cambien los equipos seleccionados, pedimos los datos a la API
  useEffect(() => {
    if (teamA && teamB && teamA !== teamB) {
      setLoading(true);
      fetch(`/api/stats/h2h?teamA=${teamA}&teamB=${teamB}`)
        .then(res => res.json())
        .then(json => {
          if (json.ok) setData(json);
          setLoading(false);
        });
    }
  }, [teamA, teamB]);

  if (!isLoaded) {
    return <div className="p-10 text-center">Cargando base de datos de Liga Titán...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <PageHeader
        title="Cara a Cara (H2H)"
        description="Historial de enfrentamientos directos entre dos equipos."
      />

      {/* Selectores de Equipos */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center bg-white p-8 rounded-xl shadow-sm border">
        <div className="w-full md:w-72 space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Equipo 1</label>
          <Select onValueChange={setTeamA}>
            <SelectTrigger><SelectValue placeholder="Selecciona rival..." /></SelectTrigger>
            <SelectContent>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-3xl font-black text-slate-200">VS</div>

        <div className="w-full md:w-72 space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Equipo 2</label>
          <Select onValueChange={setTeamB}>
            <SelectTrigger><SelectValue placeholder="Selecciona rival..." /></SelectTrigger>
            <SelectContent>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <div className="text-center py-10 italic">Analizando historial...</div>}

      {data && !loading && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Marcador de Victorias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-600 text-white border-none">
              <CardHeader className="text-center pb-2"><CardTitle className="text-xs opacity-80 uppercase">Victorias T1</CardTitle></CardHeader>
              <CardContent className="text-center"><p className="text-5xl font-black">{data.stats.winsA}</p></CardContent>
            </Card>
            <Card className="bg-slate-100 text-slate-600 border-none">
              <CardHeader className="text-center pb-2"><CardTitle className="text-xs uppercase">Empates</CardTitle></CardHeader>
              <CardContent className="text-center"><p className="text-5xl font-black">{data.stats.draws}</p></CardContent>
            </Card>
            <Card className="bg-red-600 text-white border-none">
              <CardHeader className="text-center pb-2"><CardTitle className="text-xs opacity-80 uppercase">Victorias T2</CardTitle></CardHeader>
              <CardContent className="text-center"><p className="text-5xl font-black">{data.stats.winsB}</p></CardContent>
            </Card>
          </div>

          {/* Lista de Partidos Previos */}
          <Card>
            <CardHeader className="border-b"><CardTitle className="text-lg">Resultados Recientes</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.history.length > 0 ? data.history.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 w-1/3">
                    <img src={m.home.badge_url} className="w-8 h-8 object-contain" alt="" />
                    <span className="font-bold text-sm">{m.home.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-slate-900 text-white px-4 py-1 rounded-md text-xl font-bold font-mono">
                      {m.home_goals} - {m.away_goals}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-1/3 justify-end text-right">
                    <span className="font-bold text-sm">{m.away.name}</span>
                    <img src={m.away.badge_url} className="w-8 h-8 object-contain" alt="" />
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-muted-foreground">
                  No hay partidos registrados entre estos equipos.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}