"use client";

import { useMemo, useState } from "react";

import { ACTIVITY_CATEGORY, ActivityFeed } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityCategory, ActivityLog } from "@/types/database";

const ALL = "all";
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** Journal complet : filtre par catégorie, actions regroupées par mois. */
export function ActivityJournal({ items }: { items: ActivityLog[] }) {
  const [category, setCategory] = useState<ActivityCategory | typeof ALL>(ALL);

  // Catégories présentes dans le journal, avec leur nombre d'actions.
  const counts = useMemo(() => {
    const map = new Map<ActivityCategory, number>();
    for (const i of items) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const months = useMemo(() => {
    const groups = new Map<string, ActivityLog[]>();
    for (const i of items) {
      if (category !== ALL && i.category !== category) continue;
      const key = monthFmt.format(new Date(i.created_at));
      groups.set(key, [...(groups.get(key) ?? []), i]);
    }
    return [...groups.entries()];
  }, [items, category]);

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">Aucune action enregistrée pour le moment.</Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
        <Chip active={category === ALL} onClick={() => setCategory(ALL)} label="Tout" count={items.length} />
        {counts.map(([c, n]) => (
          <Chip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={(ACTIVITY_CATEGORY[c] ?? ACTIVITY_CATEGORY.other).label}
            count={n}
          />
        ))}
      </div>

      {months.map(([month, list]) => (
        <Card key={month}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-baseline justify-between gap-3 text-base">
              <span className="first-letter:uppercase">{month}</span>
              <span className="text-xs font-normal text-muted-foreground tabular">
                {list.length} action{list.length > 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={list} full />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-havnn-blue bg-havnn-blue/15 text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className="tabular text-muted-foreground">{count}</span>
    </button>
  );
}
