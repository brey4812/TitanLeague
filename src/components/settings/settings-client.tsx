"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateStatsAction } from "@/app/actions";

export function SettingsClient() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Datos</CardTitle>
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
  );
}
