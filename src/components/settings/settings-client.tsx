"use client";

import { useTransition, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateStatsAction } from "@/app/actions";
import { LeagueContext } from "@/context/league-context";


export function SettingsClient() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { resetLeagueData } = useContext(LeagueContext);

  const handleGenerateStats = () => {
    startTransition(async () => {
      toast({
        title: "Generando Estadísticas...",
        description: "La IA está creando datos iniciales de jugadores. Esto puede tardar un momento.",
      });
      const result = await generateStatsAction();
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleResetData = () => {
    resetLeagueData();
    toast({
        title: "Datos Reiniciados",
        description: "Se ha eliminado todo el progreso de la simulación.",
    });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Datos de la IA</CardTitle>
          <CardDescription>
            Usa la IA para poblar tu liga con datos iniciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Generar Estadísticas Iniciales de Jugadores</h4>
              <p className="text-sm text-muted-foreground">
                Crea una lista completa de jugadores para todos los equipos de la liga automáticamente.
              </p>
            </div>
            <Button onClick={handleGenerateStats} disabled={isPending}>
              {isPending ? "Generando..." : "Generar"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Zona de Peligro</CardTitle>
          <CardDescription>
            Estas acciones son irreversibles. Ten cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5 text-destructive">
            <div>
              <h4 className="font-medium text-destructive">Reiniciar Datos de la Simulación</h4>
              <p className="text-sm text-destructive/80">
                Esto borrará todos los equipos, jugadores y resultados. La acción no se puede deshacer.
              </p>
            </div>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Reiniciar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto borrará permanentemente todos los datos de la simulación, incluyendo equipos, jugadores y resultados de los partidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
