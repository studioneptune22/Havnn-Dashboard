/**
 * Détection des concurrents : entreprises recommandées par les IA mais absentes des marques suivies.
 * Les plus fréquentes sont ajoutées automatiquement aux concurrents du client.
 * Fonctions pures, testées dans scan.test.ts.
 */

import { matchBrand, normalize, type BrandMatcher } from "./analyze";
import { runsOf } from "./runs";
import { SCAN_ENGINES, type DiscoveredBrand, type QuestionResult } from "./types";

/** Annuaires, plateformes et réseaux sociaux : jamais des concurrents. */
const PLATFORMS = [
  "pagesjaunes", "pages jaunes", "houzz", "google", "habitatpresto", "travaux com", "starofservice", "mappy", "yelp",
  "facebook", "instagram", "linkedin", "tripadvisor", "wikipedia", "youtube", "reddit", "quotatis", "hellopro", "cylex",
  "justacote", "118712", "118218", "kompass", "societe com", "pappers", "manageo", "infonet", "leboncoin", "le bon coin",
  "doctolib", "trustpilot", "planity", "solocal", "mon artisan", "artisans du coin", "bobex", "chantier prive", "izi by edf",
];

/** Formes juridiques et mots de liaison sans valeur pour reconnaître une entreprise. */
const NOISE = new Set(["sarl", "sas", "sasu", "eurl", "sa", "sci", "ets", "etablissements", "etablissement", "ste", "societe", "entreprise"]);

/** Seuils d'ajout automatique : cité dans au moins 2 questions et 3 réponses. */
export const AUTO_ADD = { minQuestions: 2, minAnswers: 3, maxPerScan: 5, maxBrands: 30 };

/** Nom affichable : sans la ville ou la précision ajoutée après un tiret ou une parenthèse. */
export function cleanName(name: string) {
  return name
    .replace(/\s*[(\[].*$/, "")
    .replace(/\s+[-–—|·]\s+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clé de regroupement : « ETS Lerch Bruno » et « Lerch Bruno » donnent la même clé. */
export function brandKey(name: string) {
  return normalize(cleanName(name))
    .split(" ")
    .filter((t) => t && !NOISE.has(t))
    .join(" ");
}

const isPlatform = (key: string) => PLATFORMS.some((p) => key === p || key.startsWith(`${p} `) || key.endsWith(` ${p}`));

/**
 * Entreprises non suivies, triées par fréquence. `ignoredKeys` : clés des concurrents que
 * Jérôme a retirés à la main, à ne jamais rajouter.
 */
export function discoverBrands(results: QuestionResult[], brands: BrandMatcher[], ignoredKeys: Set<string>) {
  const found = new Map<string, { names: Map<string, number>; questions: Set<string>; answers: number; chatgpt: number; gemini: number }>();

  for (const r of results) {
    for (const engine of SCAN_ENGINES) {
      const result = r.engines[engine];
      if (!result) continue;
      for (const run of runsOf(result)) {
        if (run.status === "error") continue;
        const inRun = new Set<string>();
        for (const name of run.ranking) {
          const key = brandKey(name);
          if (key.replace(/ /g, "").length < 3 || isPlatform(key) || ignoredKeys.has(key)) continue;
          if (matchBrand(name, brands)) continue;
          if (inRun.has(key)) continue;
          inRun.add(key);
          const entry = found.get(key) ?? { names: new Map(), questions: new Set(), answers: 0, chatgpt: 0, gemini: 0 };
          const display = cleanName(name);
          entry.names.set(display, (entry.names.get(display) ?? 0) + 1);
          entry.questions.add(r.question);
          entry.answers += 1;
          entry[engine] += 1;
          found.set(key, entry);
        }
      }
    }
  }

  return Array.from(found.values())
    .map((e): DiscoveredBrand => {
      const names = Array.from(e.names.entries()).sort((a, b) => b[1] - a[1]).map(([n]) => n);
      return {
        name: names[0]!,
        variants: names.slice(1, 4),
        answers: e.answers,
        questions: e.questions.size,
        chatgpt: e.chatgpt,
        gemini: e.gemini,
        added: false,
      };
    })
    .sort((a, b) => b.questions - a.questions || b.answers - a.answers || a.name.localeCompare(b.name));
}

/** Concurrents à ajouter automatiquement, dans la limite du nombre de marques suivies. */
export function brandsToAdd(discovered: DiscoveredBrand[], trackedCount: number) {
  const room = Math.max(0, Math.min(AUTO_ADD.maxPerScan, AUTO_ADD.maxBrands - trackedCount));
  return discovered.filter((d) => d.questions >= AUTO_ADD.minQuestions && d.answers >= AUTO_ADD.minAnswers).slice(0, room);
}
