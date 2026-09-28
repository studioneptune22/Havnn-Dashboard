import { ACTIVE_ENGINES } from "@/components/dashboard/chart-theme";
import type { AiEngine, PromptMonitoring } from "@/types/database";

export const ENGINES: readonly AiEngine[] = ACTIVE_ENGINES;

export type PromptOutcome = "success" | "partial" | "missed" | "pending";

/** Réussi = cité sur tous les moteurs scannés · Partiel = sur certains · Manqué = aucun. */
export function promptOutcome(p: PromptMonitoring): PromptOutcome {
  const statuses = ENGINES.map((e) => p[`${e}_status`]).filter((s) => s !== "pending");
  if (statuses.length === 0) return "pending";
  const cited = statuses.filter((s) => s === "cited").length;
  if (cited === statuses.length) return "success";
  if (cited === 0) return "missed";
  return "partial";
}
