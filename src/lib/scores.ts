import { isNapAligned } from "@/lib/locations";
import type { NapCitation, SentimentSnapshot, TechnicalCheck } from "@/types/database";

/** % de conformité d'un pilier : ok = 1, warning = 0,5, error/pending = 0 · null = pas encore audité. */
export function checksScore(checks: TechnicalCheck[]) {
  if (checks.length === 0) return null;
  const points = checks.reduce((sum, c) => sum + (c.status === "ok" ? 1 : c.status === "warning" ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}

/**
 * Conformité NAP par fiche : une fiche ne compte que si Nom, Adresse et Téléphone sont tous justes
 * (une fiche « presque juste » contredit quand même les autres aux yeux des moteurs).
 */
export function napConformity(citations: NapCitation[]) {
  const misaligned = citations.filter((c) => !isNapAligned(c)).length;
  const score = citations.length ? Math.round(((citations.length - misaligned) / citations.length) * 100) : null;
  return { score, misaligned };
}

/** Part d'avis et de réponses IA positives (moyenne des sources) · null = pas encore analysé. */
export function sentimentScore(snapshots: SentimentSnapshot[]) {
  if (snapshots.length === 0) return null;
  return Math.round(snapshots.reduce((sum, s) => sum + Number(s.positive_pct), 0) / snapshots.length);
}
