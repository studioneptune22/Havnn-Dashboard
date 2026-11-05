import {
  Bot,
  Code2,
  FileBarChart,
  FileText,
  MapPin,
  PenLine,
  Radar,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import type { ActivityCategory, ActivityLog } from "@/types/database";

export const ACTIVITY_CATEGORY: Record<ActivityCategory, { icon: LucideIcon; label: string }> = {
  schema: { icon: Code2, label: "Schema.org" },
  nap: { icon: MapPin, label: "NAP & annuaires" },
  content: { icon: PenLine, label: "Contenu" },
  reviews: { icon: Star, label: "Avis Google" },
  llms_txt: { icon: Bot, label: "llms.txt" },
  report: { icon: FileBarChart, label: "Rapport" },
  monitoring: { icon: Radar, label: "Monitoring IA" },
  seo: { icon: Search, label: "Référencement" },
  other: { icon: FileText, label: "Divers" },
};

/** `full` : descriptions affichées en entier (page Journal) au lieu de 2 lignes. */
export function ActivityFeed({ items, full = false }: { items: ActivityLog[]; full?: boolean }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aucune action enregistrée pour le moment.</p>;
  }

  return (
    <ol className="relative space-y-5">
      <span aria-hidden className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />
      {items.map((item) => {
        const { icon: Icon, label } = ACTIVITY_CATEGORY[item.category] ?? ACTIVITY_CATEGORY.other;
        return (
          <li key={item.id} className="relative flex gap-3">
            <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-card">
              <Icon className="h-3.5 w-3.5 text-havnn-blue" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <time dateTime={item.created_at} className="shrink-0 text-xs text-muted-foreground tabular">
                  {formatDate(item.created_at)}
                </time>
              </div>
              {item.description && (
                <p className={cn("mt-0.5 text-xs text-muted-foreground", !full && "line-clamp-2")}>{item.description}</p>
              )}
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
