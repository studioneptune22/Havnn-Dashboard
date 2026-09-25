import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Affiche une variation. `invert` = une baisse est une bonne nouvelle
 * (ex : incohérences NAP).
 */
export function DeltaBadge({
  value,
  unit = " pts",
  invert = false,
  suffix = "vs mois dernier",
}: {
  value: number;
  unit?: string;
  invert?: boolean;
  suffix?: string;
}) {
  const good = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular",
          neutral && "bg-secondary text-muted-foreground",
          !neutral && good && "bg-emerald-500/10 text-emerald-400",
          !neutral && !good && "bg-rose-500/10 text-rose-400",
        )}
      >
        <Icon className="h-3 w-3" />
        {sign}
        {Math.abs(value).toLocaleString("fr-FR")}
        {unit}
      </span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}
