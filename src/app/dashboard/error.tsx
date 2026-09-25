"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div className="space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="text-lg font-semibold">Impossible de charger vos données</h2>
        <p className="text-sm text-muted-foreground">Réessayez dans un instant ou contactez votre consultant HAVNN.</p>
        <Button onClick={reset} variant="outline">Réessayer</Button>
      </div>
    </div>
  );
}
