"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { ENGINE_LABELS } from "@/components/dashboard/chart-theme";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { PromptMonitoring } from "@/types/database";

import { EngineStatus } from "./engine-status";
import { PromptDetailSheet } from "./prompt-detail-sheet";
import { ENGINES, promptOutcome, type PromptOutcome } from "./prompt-utils";

type Filter = "all" | Exclude<PromptOutcome, "pending">;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "success", label: "Réussis" },
  { value: "partial", label: "Partiels" },
  { value: "missed", label: "Manqués" },
];

export function PromptsTable({ prompts }: { prompts: PromptMonitoring[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PromptMonitoring | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: prompts.length, success: 0, partial: 0, missed: 0 };
    for (const p of prompts) {
      const o = promptOutcome(p);
      if (o !== "pending") c[o]++;
    }
    return c;
  }, [prompts]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter(
      (p) =>
        (filter === "all" || promptOutcome(p) === filter) && (!q || p.prompt_text.toLowerCase().includes(q)),
    );
  }, [prompts, filter, query]);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
                <span className="rounded bg-background/60 px-1.5 text-[11px] text-muted-foreground tabular">
                  {counts[f.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un prompt…"
            className="h-9 bg-card pl-9"
            aria-label="Rechercher un prompt"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[280px]">Prompt métier</TableHead>
            {ENGINES.map((e) => (
              <TableHead key={e} className="min-w-[120px]">
                {ENGINE_LABELS[e]}
              </TableHead>
            ))}
            <TableHead className="min-w-[100px]">Dernier scan</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow
              key={p.id}
              tabIndex={0}
              role="button"
              aria-label={`Voir le détail : ${p.prompt_text}`}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p);
                }
              }}
              className="cursor-pointer focus-visible:bg-accent/40 focus-visible:outline-none"
            >
              <TableCell className="font-medium">{p.prompt_text}</TableCell>
              {ENGINES.map((e) => (
                <TableCell key={e}>
                  <EngineStatus status={p[`${e}_status`]} position={p[`${e}_position`]} />
                </TableCell>
              ))}
              <TableCell className="text-xs text-muted-foreground tabular">{formatDate(p.scanned_at)}</TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                Aucun prompt ne correspond à ce filtre.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PromptDetailSheet prompt={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
