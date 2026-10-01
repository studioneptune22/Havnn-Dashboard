"use client";

import { Sparkles } from "lucide-react";

import { ENGINE_COLORS, ENGINE_LABELS } from "@/components/dashboard/chart-theme";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/utils";
import type { PromptMonitoring } from "@/types/database";

import { EngineStatus } from "./engine-status";
import { ENGINES } from "./prompt-utils";
import { Snippet } from "./snippet";

export function PromptDetailSheet({
  prompt,
  locationName,
  onOpenChange,
}: {
  prompt: PromptMonitoring | null;
  /** Centre auquel la question est rattachée (clients multi-sites). */
  locationName?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={prompt !== null} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto scrollbar-thin">
        {prompt && (
          <>
            <SheetHeader className="pr-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="w-fit">
                  Dernier scan · {formatDateTime(prompt.scanned_at)}
                </Badge>
                {locationName && (
                  <Badge variant="outline" className="w-fit">
                    {locationName}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl leading-snug">« {prompt.prompt_text} »</SheetTitle>
              <SheetDescription>Résultat de la marque sur chaque moteur IA lors du dernier scan.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {ENGINES.map((engine) => (
                <div key={engine} className="rounded-lg border bg-background/50 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ENGINE_COLORS[engine] }} />
                    {ENGINE_LABELS[engine]}
                  </div>
                  <EngineStatus status={prompt[`${engine}_status`]} position={prompt[`${engine}_position`]} />
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-havnn-blue" />
                Extrait de la réponse générée
              </h4>

              {prompt.ai_snippet ? (
                <blockquote className="rounded-lg border-l-2 border-havnn-blue bg-background/50 p-4">
                  <Snippet text={prompt.ai_snippet} />
                </blockquote>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun extrait disponible pour ce scan.</p>
              )}

              {ENGINES.filter((e) => prompt.ai_snippets?.[e]).map((engine) => (
                <div key={engine} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {ENGINE_LABELS[engine]}
                  </p>
                  <blockquote className="rounded-lg border bg-background/50 p-4">
                    <Snippet text={prompt.ai_snippets[engine]!} />
                  </blockquote>
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Les passages surlignés correspondent aux mentions de votre marque. Les réponses des IA varient
                d&apos;une requête à l&apos;autre : HAVNN agrège plusieurs exécutions par scan.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
