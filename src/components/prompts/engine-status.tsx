import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AiCitationStatus } from "@/types/database";

export function EngineStatus({
  status,
  position,
  className,
}: {
  status: AiCitationStatus;
  position: number | null;
  className?: string;
}) {
  if (status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Clock className="h-3.5 w-3.5" />
        En cours
      </span>
    );
  }
  if (status === "not_cited") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-rose-400", className)}>
        <XCircle className="h-3.5 w-3.5" />
        Non cité
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-emerald-400", className)}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      Cité
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
