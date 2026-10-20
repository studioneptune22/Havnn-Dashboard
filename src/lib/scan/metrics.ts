/**
 * Chiffres du Cockpit calculés à partir d'un relevé : score de dominance, taux de présence,
 * part de voix. Même méthode que le relevé manuel.
 *
 * Score = 50 % × taux de citation + 20 % × taux de top 3 + 15 % × (note Google / 5)
 *       + 15 % × conformité NAP (une fiche ne compte que si Nom, Adresse et Téléphone sont justes).
 */

import type { BrandMatcher } from "./analyze";
import { runsOf } from "./runs";
import { SCAN_ENGINES, type BrandShare, type QuestionResult, type ScanEngine, type Stability } from "./types";

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

/**
 * Chiffres calculés sur l'ensemble des passages : chaque passage compte comme une réponse.
 * Part de voix : nombre de questions où la marque apparaît, pondéré par sa fréquence
 * dans les passages (cité 2 fois sur 3 = 2/3 de question), arrondi.
 */
export function computeMetrics(results: QuestionResult[], brands: BrandMatcher[], inputs: ScoreInputs) {
  let answers = 0;
  let cited = 0;
  let top3 = 0;
  let firstPlace = 0;
  let errors = 0;
  const engineRate: Record<ScanEngine, number | null> = { chatgpt: null, gemini: null };
  const stability: Stability = { solid: 0, fragile: 0, absent: 0 };

  for (const engine of SCAN_ENGINES) {
    if (results.every((r) => !r.engines[engine])) continue; // moteur non interrogé
    let engineOk = 0;
    let engineCited = 0;
    for (const r of results) {
      const result = r.engines[engine];
      if (!result) continue;
      const runs = runsOf(result);
      const ok = runs.filter((x) => x.status !== "error");
      const okCited = ok.filter((x) => x.status === "cited");
      errors += runs.length - ok.length;
      engineOk += ok.length;
      engineCited += okCited.length;
      top3 += okCited.filter((x) => x.position !== null && x.position <= 3).length;
      firstPlace += okCited.filter((x) => x.position === 1).length;
      if (ok.length) {
        if (okCited.length === ok.length) stability.solid++;
        else if (okCited.length > 0) stability.fragile++;
        else stability.absent++;
      }
    }
    answers += engineOk;
    cited += engineCited;
    engineRate[engine] = engineOk ? round1(pct(engineCited, engineOk)) : null;
  }

  const citedRate = pct(cited, answers);
  const top3Rate = pct(top3, answers);

  /** Somme, sur les questions, de la part des passages qui citent la marque. */
  const presence = (engine: ScanEngine, brand: string) =>
    Math.round(
      results.reduce((sum, r) => {
        const result = r.engines[engine];
        if (!result) return sum;
        const ok = runsOf(result).filter((x) => x.status !== "error");
        return ok.length ? sum + ok.filter((x) => x.mentions.includes(brand)).length / ok.length : sum;
      }, 0),
    );

  const shareOfVoice: BrandShare[] = brands.map((b) => ({
    name: b.name,
    is_client: b.is_client,
    chatgpt: presence("chatgpt", b.name),
    gemini: presence("gemini", b.name),
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
    stability,
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
