"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateStatsAction } from "@/app/actions";
import { Icons } from "@/components/icons";

export function SettingsClient() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateStats = () => {
    startTransition(async () => {
      toast({
        title: "Generating Stats...",
        description: "The AI is creating initial player data. This may take a moment.",
      });
      const result = await generateStatsAction();
      if (result.success) {
        toast({
          title: "Success!",
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
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Use AI to populate your league with initial data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Generate Initial Player Stats</h4>
            <p className="text-sm text-muted-foreground">
              Create a full roster of players for all teams in the league automatically.
            </p>
          </div>
          <Button onClick={handleGenerateStats} disabled={isPending}>
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
