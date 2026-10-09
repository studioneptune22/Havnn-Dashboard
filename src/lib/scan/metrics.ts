/**
 * Chiffres du Cockpit calculés à partir d'un relevé : score de dominance, taux de présence,
 * part de voix. Même méthode que le relevé manuel.
 *
 * Score = 50 % × taux de citation + 20 % × taux de top 3 + 15 % × (note Google / 5)
 *       + 15 % × conformité NAP (une fiche ne compte que si Nom, Adresse et Téléphone sont justes).
 */

import type { BrandMatcher } from "./analyze";
import { SCAN_ENGINES, type BrandShare, type QuestionResult, type ScanEngine } from "./types";

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export interface ScoreInputs {
  googleRating: number | null;
  /** Conformité NAP en % (null = aucune fiche auditée, compte pour 0). */
  napConformity: number | null;
}

export function dominanceScore(citedRate: number, top3Rate: number, { googleRating, napConformity }: ScoreInputs) {
  const score =
    0.5 * citedRate + 0.2 * top3Rate + 0.15 * (((googleRating ?? 0) / 5) * 100) + 0.15 * (napConformity ?? 0);
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function computeMetrics(results: QuestionResult[], brands: BrandMatcher[], inputs: ScoreInputs) {
  const answered = (e: ScanEngine) => results.map((r) => r.engines[e]).filter((x) => x && x.status !== "error");

  let answers = 0;
  let cited = 0;
  let top3 = 0;
  let firstPlace = 0;
  let errors = 0;
  const engineRate: Record<ScanEngine, number | null> = { chatgpt: null, gemini: null };

  for (const engine of SCAN_ENGINES) {
    const ok = answered(engine);
    errors += results.filter((r) => r.engines[engine]?.status === "error").length;
    if (results.every((r) => !r.engines[engine])) continue; // moteur non interrogé
    const engineCited = ok.filter((x) => x!.status === "cited");
    answers += ok.length;
    cited += engineCited.length;
    top3 += engineCited.filter((x) => x!.position !== null && x!.position <= 3).length;
    firstPlace += engineCited.filter((x) => x!.position === 1).length;
    engineRate[engine] = ok.length ? round1(pct(engineCited.length, ok.length)) : null;
  }

  const citedRate = pct(cited, answers);
  const top3Rate = pct(top3, answers);

  const shareOfVoice: BrandShare[] = brands.map((b) => ({
    name: b.name,
    is_client: b.is_client,
    chatgpt: results.filter((r) => r.engines.chatgpt?.mentions.includes(b.name)).length,
    gemini: results.filter((r) => r.engines.gemini?.mentions.includes(b.name)).length,
  }));

  return {
    score: dominanceScore(citedRate, top3Rate, inputs),
    ai_presence_rate: round1(citedRate),
    top3_rate: round1(top3Rate),
    chatgpt_presence_rate: engineRate.chatgpt,
    gemini_presence_rate: engineRate.gemini,
    questions: results.length,
    answers,
    cited,
    first_place: firstPlace,
    errors,
    share_of_voice: shareOfVoice,
  };
}

/** Meilleur extrait pour la colonne `ai_snippet` : une réponse qui cite le client, sinon ChatGPT. */
export function mainSnippet(result: QuestionResult) {
  const engines = SCAN_ENGINES.map((e) => result.engines[e]).filter(Boolean);
  return (
    engines.find((e) => e!.status === "cited")?.snippet ??
    engines.find((e) => e!.status !== "error")?.snippet ??
    null
  );
}
