"use client";

import { useContext } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueContext } from "@/context/league-context";
import { Download, Upload, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfigPage() {
  const { teams, matches, resetLeagueData } = useContext(LeagueContext);
  const { toast } = useToast();

  // Función para exportar datos (Copia de Seguridad)
  const exportData = () => {
    const dataStr = JSON.stringify({ teams, matches }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup-liga-titan-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({ title: "Copia de Seguridad creada", description: "Se ha descargado el archivo con tus equipos y partidos." });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Configuración y Sistema" 
        description="Gestiona tus datos, crea copias de seguridad o reinicia la liga." 
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Backup */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" /> Copia de Seguridad
            </CardTitle>
            <CardDescription>Descarga todos tus datos actuales en un archivo para no perder el progreso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportData} className="w-full">Descargar JSON de la Liga</Button>
          </CardContent>
        </Card>

        {/* Card de Reseteo */}
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Zona de Peligro
            </CardTitle>
            <CardDescription>Esto borrará todos los equipos importados y resultados. No se puede deshacer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full gap-2" 
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