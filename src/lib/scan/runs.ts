/**
 * Passages multiples : une question est posée plusieurs fois à chaque moteur, car les réponses
 * des IA varient d'un appel à l'autre. Fonctions pures, testées dans scan.test.ts.
 */

import type { EngineResult, RunResult, Source } from "./types";

/** Passage analysé, avec le texte gardé en mémoire le temps du relevé (non enregistré). */
export interface RunDetail extends RunResult {
  answer: string;
  snippet: string | null;
  sources: Source[];
}

/** Passages d'un résultat ; un relevé ancien (un seul passage, sans `runs`) compte pour un passage. */
export function runsOf(result: EngineResult): RunResult[] {
  return (
    result.runs ?? [
      { status: result.status, position: result.position, mentions: result.mentions, ranking: result.ranking, error: result.error },
    ]
  );
}

/** Passages exploitables et passages où le client est cité. */
export function citedRuns(result: EngineResult | undefined) {
  if (!result) return null;
  const ok = runsOf(result).filter((r) => r.status !== "error");
  return { cited: ok.filter((r) => r.status === "cited").length, total: ok.length };
}

/** Le résultat hésite (cité certains passages, pas d'autres) : il mérite des passages en plus. */
export function isUncertain(runs: RunResult[]) {
  const ok = runs.filter((r) => r.status !== "error");
  const cited = ok.filter((r) => r.status === "cited").length;
  return cited > 0 && cited < ok.length;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * Résumé des passages d'une question sur un moteur :
 * cité si le client l'est dans au moins la moitié des passages, position médiane,
 * extrait et réponse d'un passage représentatif (le premier qui cite le client).
 */
export function aggregateRuns(details: RunDetail[]): EngineResult {
  const runs: RunResult[] = details.map(({ status, position, mentions, ranking, error }) => ({
    status,
    position,
    mentions,
    ranking,
    ...(error ? { error } : {}),
  }));
  const ok = details.filter((d) => d.status !== "error");
  if (ok.length === 0) {
    return {
      status: "error",
      position: null,
      mentions: [],
      ranking: [],
      snippet: null,
      answer: "",
      sources: [],
      error: details[0]?.error ?? "aucune réponse",
      runs,
    };
  }

  const cited = ok.filter((d) => d.status === "cited");
  const status = cited.length * 2 >= ok.length ? "cited" : "not_cited";
  const representative = (status === "cited" ? cited[0] : ok[0])!;
  const mentions = Array.from(new Set(ok.flatMap((d) => d.mentions)));
  const seen = new Set<string>();
  const sources = ok
    .flatMap((d) => d.sources)
    .filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)))
    .slice(0, 12);

  return {
    status,
    position: status === "cited" ? median(cited.map((d) => d.position).filter((p): p is number => p !== null)) : null,
    mentions,
    ranking: representative.ranking,
    snippet: representative.snippet,
    answer: representative.answer,
    sources,
    runs,
  };
}
