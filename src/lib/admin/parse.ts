/**
 * Saisie de la vue admin : lecture et mise en forme des champs texte
 * (questions suivies, concurrents et variantes de nom). Fonctions pures, testées dans parse.test.ts.
 */

import type { Location } from "@/types/database";

export const MAX_QUESTIONS = 50;
export const MAX_BRANDS = 30;

/** « https://www.exemple.fr/contact » → « exemple.fr » ; null si vide. */
export function normalizeDomain(value: string) {
  const domain = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
  return domain || null;
}

export interface ParsedQuestion {
  text: string;
  locationId: string | null;
}

/**
 * Une question par ligne. Client multi-sites : « [Nom du centre] Question » rattache la question
 * à un établissement. Doublons et lignes vides ignorés.
 */
export function parseQuestions(input: string, locations: Pick<Location, "id" | "name">[]) {
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const byName = new Map(locations.map((l) => [l.name.trim().toLowerCase(), l.id]));

  for (const raw of input.split("\n")) {
    let line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    let locationId: string | null = null;
    const tagged = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
    if (tagged) {
      locationId = byName.get(tagged[1]!.trim().toLowerCase()) ?? null;
      if (!locationId) {
        errors.push(`Centre inconnu : « ${tagged[1]} ».`);
        continue;
      }
      line = tagged[2]!.trim();
    }
    if (!line) continue;
    if (line.length > 500) {
      errors.push(`Question trop longue (500 caractères max) : « ${line.slice(0, 60)}… ».`);
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push({ text: line, locationId });
  }
  if (questions.length > MAX_QUESTIONS) errors.push(`${questions.length} questions : ${MAX_QUESTIONS} maximum.`);
  return { questions, errors };
}

export function formatQuestions(
  prompts: { prompt_text: string; location_id: string | null }[],
  locations: Pick<Location, "id" | "name">[],
) {
  const names = new Map(locations.map((l) => [l.id, l.name]));
  return prompts
    .map((p) => {
      const centre = p.location_id ? names.get(p.location_id) : null;
      return centre ? `[${centre}] ${p.prompt_text}` : p.prompt_text;
    })
    .join("\n");
}

/** Variantes séparées par des virgules, sans doublon ni rappel du nom principal. */
export function parseAliases(input: string, name = "") {
  const seen = new Set([name.trim().toLowerCase()]);
  return input
    .split(",")
    .map((a) => a.replace(/\s+/g, " ").trim())
    .filter((a) => {
      const key = a.toLowerCase();
      if (!a || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export interface ParsedBrand {
  name: string;
  aliases: string[];
}

/** Un concurrent par ligne : « Nom | variante 1, variante 2 ». */
export function parseCompetitors(input: string) {
  const brands: ParsedBrand[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.split("\n")) {
    if (!raw.trim()) continue;
    const [namePart, ...rest] = raw.split("|");
    const name = namePart!.replace(/\s+/g, " ").trim();
    if (!name) {
      errors.push(`Ligne sans nom : « ${raw.trim()} ».`);
      continue;
    }
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    brands.push({ name, aliases: parseAliases(rest.join(","), name) });
  }
  if (brands.length > MAX_BRANDS) errors.push(`${brands.length} concurrents : ${MAX_BRANDS} maximum.`);
  return { brands, errors };
}

export function formatCompetitors(brands: ParsedBrand[]) {
  return brands.map((b) => (b.aliases.length ? `${b.name} | ${b.aliases.join(", ")}` : b.name)).join("\n");
}

/** Date « AAAA-MM-JJ » du jour, heure de Paris. */
export function todayInParis(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

/**
 * Horodatage d'une entrée du journal : maintenant si la date est aujourd'hui,
 * sinon midi (heure de Paris environ) le jour indiqué. null si la date est invalide ou future.
 */
export function journalTimestamp(date: string, now = new Date()) {
  if (!date || date === todayInParis(now)) return now.toISOString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T10:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date || d > now) return null;
  return d.toISOString();
}
