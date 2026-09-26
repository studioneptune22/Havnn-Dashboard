"use client";

import { useEffect, useState } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { Film, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "hyperframes-player": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        /** React 18 transmet `class` tel quel aux custom elements (pas `className`). */
        class?: string;
        controls?: boolean;
        muted?: boolean;
        autoplay?: boolean;
        loop?: boolean;
        width?: number;
        height?: number;
        "low-power-idle"?: boolean;
      };
    }
  }
}

/**
 * Lecteur de la vidéo "Bilan GEO du mois" (composition HyperFrames servie depuis
 * /public/hyperframes/bilan-mensuel). Le web component s'enregistre côté client uniquement.
 */
export function MonthlyRecapVideo({ src, className }: { src: string; className?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@hyperframes/player").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg border bg-havnn-abyss", className)}>
      {ready ? (
        <hyperframes-player src={src} controls muted low-power-idle class="block aspect-video w-full" />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <div className="flex items-center gap-2 text-sm">
            <Film className="h-4 w-4" />
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
