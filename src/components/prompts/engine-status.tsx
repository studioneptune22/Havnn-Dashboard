import { CheckCircle2, CircleDashed, Clock, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AiCitationStatus } from "@/types/database";

/**
 * Statut d'une question sur un moteur. Avec plusieurs passages (`runs` = [cité, passages]) :
 * « Cité » s'il l'est à chaque passage, « Parfois cité » s'il l'est à certains seulement.
 */
export function EngineStatus({
  status,
  position,
  runs,
  className,
}: {
  status: AiCitationStatus;
  position: number | null;
  runs?: [number, number];
  className?: string;
}) {
  const fraction = runs && runs[1] > 1 ? <span className="tabular text-[11px] opacity-80">{runs[0]}/{runs[1]}</span> : null;
  const sometimes = runs && runs[0] > 0 && runs[0] < runs[1];

  if (status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Clock className="h-3.5 w-3.5" />
        En cours
      </span>
    );
  }
  if (sometimes) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-xs text-amber-400", className)}
        title={`Cité dans ${runs[0]} réponses sur ${runs[1]}`}
      >
        <CircleDashed className="h-3.5 w-3.5" />
        Parfois cité
        {fraction}
        {position !== null && (
          <span className="rounded bg-amber-500/15 px-1 py-px font-mono text-[11px] tabular text-amber-300">#{position}</span>
        )}
      </span>
    );
  }
  if (status === "not_cited") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-rose-400", className)}>
        <XCircle className="h-3.5 w-3.5" />
        Non cité
        {fraction}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-emerald-400", className)}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      Cité
      {fraction}
      {position !== null && (
        <span
          className={cn(
            "rounded px-1 py-px font-mono text-[11px] tabular",
            position <= 3 ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground",
          )}
        >
          #{position}
        </span>
      )}
    </span>
  );
}
