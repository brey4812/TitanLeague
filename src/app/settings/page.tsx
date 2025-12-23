"use client";

import { useContext, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Download, Upload, Trash2, ShieldAlert, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfigPage() {
  const { teams, matches, resetLeagueData, importLeagueData } = useContext(LeagueContext) as any;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para exportar datos (Copia de Seguridad)
  const exportData = () => {
    if (teams.length === 0) {
      toast({ title: "Sin datos", description: "No hay equipos para exportar.", variant: "destructive" });
      return;
    }

    const dataStr = JSON.stringify({ teams, matches }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup-liga-titan-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({ title: "Copia de Seguridad creada", description: "Se ha descargado el archivo con tus equipos y partidos." });
  };

  // Función para importar datos
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.teams) {
          const success = importLeagueData(json);
          if (success) {
            toast({ title: "Importación Exitosa", description: `${json.teams.length} equipos cargados correctamente.` });
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "El archivo no es un JSON de liga válido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Configuración y Sistema" 
        description="Gestiona tus datos, crea copias de seguridad o reinicia la liga." 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Exportar */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" /> Exportar Datos
            </CardTitle>
            <CardDescription>Guarda tu progreso actual en un archivo externo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportData} variant="outline" className="w-full gap-2">
              <FileJson className="h-4 w-4" /> Descargar JSON
            </Button>
          </CardContent>
        </Card>

        {/* Card de Importar */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" /> Importar Datos
            </CardTitle>
            <CardDescription>Restaura una copia de seguridad previa.</CardDescription>
          </CardHeader>
          <CardContent>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
              accept=".json" 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="w-full gap-2 border-emerald-200 hover:bg-emerald-50"
            >
              <Upload className="h-4 w-4" /> Seleccionar Archivo
            </Button>
          </CardContent>
        </Card>

        {/* Card de Reseteo */}
        <Card className="border-2 border-destructive/20 bg-destructive/5 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Zona de Peligro
            </CardTitle>
            <CardDescription>Borrado total de datos locales. No se puede deshacer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full gap-2 shadow-sm" 
              onClick={() => {
                if(confirm("¿Estás SEGURO? Se borrará todo el progreso, equipos y jugadores.")) {
                  resetLeagueData();
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Resetear Todo (Fábrica)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}